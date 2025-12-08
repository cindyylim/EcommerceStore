import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import CheckoutSession from '../models/checkoutSession.model.js';
import Product from '../models/product.model.js';
import { executeBatchedBulkWrite } from './bulkOperationHelper.js';
// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Service to handle scheduled expiry of checkout sessions
 * This should be run periodically (e.g., every minute) to check for expired sessions
 */

/**
 * Find and expire all checkout sessions that have passed their expiry time
 * @returns {Promise<Object>} - Results of the expiry process
 */
/**
 * Extract session ID from Stripe checkout URL
 * @param {string} sessionUrlOrId - Either a full Stripe checkout URL or just the session ID
 * @returns {string} - The session ID
 */
const extractSessionId = (sessionUrlOrId) => {
  // If it's already a session ID (starts with 'cs_'), return as is
  if (sessionUrlOrId.startsWith('cs_')) {
    return sessionUrlOrId;
  }

  // If it's a URL, extract the session ID from the path
  try {
    const url = new URL(sessionUrlOrId);
    const pathParts = url.pathname.split('/');
    const sessionId = pathParts[pathParts.length - 1];

    // Validate that it looks like a session ID
    if (sessionId.startsWith('cs_')) {
      return sessionId;
    }

    throw new Error('Invalid session URL format');
  } catch (error) {
    throw new Error(`Could not extract session ID from URL: ${sessionUrlOrId}`);
  }
};

/**
 * Expire a specific checkout session by URL or ID
 * @param {string} sessionUrlOrId - Stripe checkout URL or session ID
 * @returns {Promise<Object>} - Result of the expiry process
 */
export const expireSpecificSession = async (sessionUrlOrId) => {
  try {
    const sessionId = extractSessionId(sessionUrlOrId);
    console.log(`Attempting to expire session: ${sessionId}`);
    // Find the session in our database
    const sessionRecord = await CheckoutSession.findOne({ sessionId });
    
    if (!sessionRecord) {
      return {
        success: false,
        message: 'Session not found in database',
        sessionId
      };
    }
    
    if (sessionRecord.status !== 'active') {
      return {
        success: false,
        message: `Session is already ${sessionRecord.status}`,
        sessionId,
        status: sessionRecord.status
      };
    }
    
    // Get the Stripe session to access metadata with product information
    let stripeSession;
    try {
      stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (retrieveError) {
      console.warn(`Warning: Could not retrieve Stripe session ${sessionId}:`, retrieveError.message);
      // Still mark the session as expired even if we can't retrieve the details
      await CheckoutSession.updateOne(
        { _id: sessionRecord._id },
        {
          status: 'expired',
          updatedAt: new Date()
        }
      );
      console.log(`✓ Marked session ${sessionId} as expired (without product cleanup)`);
      return {
        success: true,
        message: 'Session expired successfully (without product cleanup)',
        sessionId
      };
    }
    
    // Remove reservations for products in this session
    if (stripeSession.metadata && stripeSession.metadata.products) {
      try {
        const products = JSON.parse(stripeSession.metadata.products);
        await removeReservationsForExpiredSession(products, sessionId);
        console.log(`✓ Removed reservations for session ${sessionId}`);
      } catch (parseError) {
        console.warn(`Warning: Could not parse products metadata for session ${sessionId}:`, parseError.message);
      }
    }
    
    // Update session status in database
    await CheckoutSession.updateOne(
      { _id: sessionRecord._id },
      {
        status: 'expired',
        updatedAt: new Date()
      }
    );
    
    console.log(`✓ Marked session ${sessionId} as expired`);
    // Try to expire the Stripe session
    try {
      await stripe.checkout.sessions.expire(sessionId);
      console.log(`✓ Expired Stripe session: ${sessionId}`);
    } catch (stripeError) {
      console.warn(`Warning: Could not expire Stripe session ${sessionId}:`, stripeError.message);
      // Continue with local expiry even if Stripe call fails
    }

    return {
      success: true,
      message: 'Session expired successfully',
      sessionId
    };
  } catch (error) {
    console.error('Error expiring session:', error);
    return {
      success: false,
      message: error.message,
      sessionUrlOrId
    };
  }
};

export const expireCheckoutSessions = async () => {
  try {
    const now = new Date();

    // Find all active checkout sessions that have expired
    const expiredSessions = await CheckoutSession.find({
      status: 'active',
      expiresAt: { $lt: now }
    }).populate('userId', 'sessionId');

    if (expiredSessions.length === 0) {
      return {
        success: true,
        message: 'No expired sessions found',
        expiredCount: 0
      };
    }

    console.log(`Found ${expiredSessions.length} expired checkout sessions to process`);

    let expiredCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process each expired session
    for (const session of expiredSessions) {
      try {
        // First, try to expire the Stripe session
        try {
          await stripe.checkout.sessions.expire(session.sessionId);
          console.log(`✓ Expired Stripe session: ${session.sessionId}`);
        } catch (stripeError) {
          // Stripe session might already be expired or invalid
          console.warn(`Warning: Could not expire Stripe session ${session.sessionId}:`, stripeError.message);
        }
        
        // Get the Stripe session to access metadata with product information
        let stripeSession;
        try {
          stripeSession = await stripe.checkout.sessions.retrieve(session.sessionId);
        } catch (retrieveError) {
          console.warn(`Warning: Could not retrieve Stripe session ${session.sessionId}:`, retrieveError.message);
          // Still mark the session as expired even if we can't retrieve the details
          await CheckoutSession.updateOne(
            { _id: session._id },
            {
              status: 'expired',
              updatedAt: now
            }
          );
          expiredCount++;
          console.log(`✓ Marked session ${session.sessionId} as expired for user ${session.userId} (without product cleanup)`);
          continue;
        }
        
        // Remove reservations for products in this session
        if (stripeSession.metadata && stripeSession.metadata.products) {
          try {
            const products = JSON.parse(stripeSession.metadata.products);
            await removeReservationsForExpiredSession(products, session.sessionId);
            console.log(`✓ Removed reservations for session ${session.sessionId}`);
          } catch (parseError) {
            console.warn(`Warning: Could not parse products metadata for session ${session.sessionId}:`, parseError.message);
          }
        }
        
        // Update session status in database
        await CheckoutSession.updateOne(
          { _id: session._id },
          {
            status: 'expired',
            updatedAt: now
          }
        );
        expiredCount++;
        console.log(`✓ Marked session ${session.sessionId} as expired for user ${session.userId}`);
      } catch (error) {
        errorCount++;
        const errorMsg = `Failed to process session ${session.sessionId}: ${error.message}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    return {
      success: true,
      message: `Processed ${expiredSessions.length} expired sessions`,
      expiredCount,
      errorCount,
      errors
    };
    
    /**
     * Remove reservations from products when a checkout session expires
     * @param {Array} products - Array of products with id, quantity, and size
     * @param {string} sessionId - The session ID whose reservations should be removed
     */
    async function removeReservationsForExpiredSession(products, sessionId) {
      const bulkOps = products.map((product) => {
        const updateOperation = {
          updateOne: {
            filter: { _id: product.id },
            update: {},
          },
        };
    
        if (product.size) {
          // --- SIZED PRODUCT LOGIC ---
          updateOperation.updateOne.update = [
            {
              $set: {
                sizes: {
                  $map: {
                    input: "$sizes",
                    as: "size",
                    in: {
                      $mergeObjects: [
                        "$$size",
                        {
                          $cond: {
                            if: { $eq: ["$$size.size", product.size] },
                            then: {
                              // Decrease the reserved count
                              reserved: {
                                $subtract: [
                                  { $ifNull: ["$$size.reserved", 0] },
                                  product.quantity,
                                ],
                              },
                              // Remove the reservation object for this session
                              reservations: {
                                $filter: {
                                  input: { $ifNull: ["$$size.reservations", []] },
                                  as: "res",
                                  cond: { $ne: ["$$res.cartSessionId", sessionId] },
                                },
                              },
                            },
                            else: "$$size", // Keep other sizes as is
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          ];
        } else {
          // --- NON-SIZED PRODUCT LOGIC ---
          updateOperation.updateOne.update = [
            {
              $set: {
                // Decrease the reserved count
                reserved: {
                  $subtract: [
                    { $ifNull: ["$reserved", 0] },
                    product.quantity,
                  ],
                },
                // Remove the reservation object for this session
                reservations: {
                  $filter: {
                    input: { $ifNull: ["$$size.reservations", []] },
                    as: "res",
                    cond: { $ne: ["$$res.cartSessionId", sessionId] },
                  },
                },
              },
            },
          ];
        }
    
        return updateOperation;
      });
    
      const bulkResult = await executeBatchedBulkWrite(bulkOps, null, Product);
      console.log(
        `✅ Removed reservations from ${bulkResult.modifiedCount} products for expired session ${sessionId}`
      );
      
      return bulkResult;
    }
  } catch (error) {
    console.error('Error in expireCheckoutSessions:', error);
    return {
      success: false,
      message: 'Failed to process expired sessions',
      error: error.message
    };
  }
};