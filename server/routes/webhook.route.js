import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';
import CheckoutSession from "../models/checkoutSession.model.js";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.expired':
      const session = event.data.object;
      console.log(`Checkout session expired: ${session.id}`);

      try {
        // Get the session record to check for inventory lock
        const sessionRecord = await CheckoutSession.findOne({ sessionId: session.id });
        
        // Mark our session record as expired
        await CheckoutSession.updateOne({ sessionId: session.id }, { status: 'expired' });

      } catch (error) {
        console.error(`Error handling expired checkout session ${session.id}:`, error);
      }
      break;

    case 'checkout.session.completed':
      const completedSession = event.data.object;
      console.log(`Checkout session completed: ${completedSession.id}`);
      // This is handled by the checkoutSuccess endpoint
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
});

export default router;