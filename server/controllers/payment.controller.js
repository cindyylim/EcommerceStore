import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import Stripe from "stripe";
import { reserveProducts, updateProductStock } from "../utils/stockService.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import IdempotencyKey from "../models/idempotencyKey.model.js";
import CheckoutSession from "../models/checkoutSession.model.js";
import mongoose from "mongoose";
import { executeBatchedBulkWrite } from "../utils/bulkOperationHelper.js";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root directory
dotenv.config({ path: path.join(__dirname, "../../.env") });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode, name, email, phone, address } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res
        .status(400)
        .json({ message: "Invalid or empty products array" });
    }

    let totalAmount = 0;
    const lineItems = products.map((product) => {
      const amount = product.price * 100;
      totalAmount += amount * product.quantity;
      return {
        price_data: {
          currency: "cad",
          product_data: {
            name: product.name,
            images: [product.image],
          },
          unit_amount: amount,
        },
        quantity: product.quantity || 1,
      };
    });
    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode,
        userId: req.user._id,
        isActive: true,
      });
      if (coupon) {
        totalAmount -= Math.round(
          totalAmount * (coupon.discountPercentage / 100)
        );
      }
    }
    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
      discounts: coupon
        ? [{ coupon: await createStripeCoupon(coupon.discountPercentage) }]
        : [],
      metadata: {
        userId: req.user._id.toString(),
        couponCode: couponCode || "",
        products: JSON.stringify(
          products.map((p) => ({
            id: p._id,
            quantity: p.quantity,
            size: p.selectedSize,
          }))
        ),
        name: name,
        email: email,
        phone: phone,
        address: address,
      },
    });

    try {
      await reserveProducts(products, session.id);
    } catch (reservationError) {
      return res.status(400).json({ message: reservationError.message });
    }
    // Create a record in our database to track this checkout session
    await CheckoutSession.create({
      sessionId: session.id,
      userId: req.user._id,
      status: "active",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    if (totalAmount >= 20000) {
      await createNewCoupon(req.user._id);
    }
    res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
  } catch (error) {
    console.log("Error in createCheckoutSession controller", error.message);

    return res.status(500).json({ message: error.message });
  }
};

async function createStripeCoupon(discountPerceentage) {
  const coupon = await stripe.coupons.create({
    duration: "once",
    percent_off: discountPerceentage,
  });
  return coupon.id;
}

async function createNewCoupon(userId) {
  await Coupon.findOneAndDelete({ userId });
  const newCoupon = new Coupon({
    code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    discountPercentage: 10,
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    userId: userId,
  });
  await newCoupon.save();
}

export const checkoutSuccess = async (req, res) => {
  console.log("=== CHECKOUT SUCCESS STARTED ===");
  console.log("Session ID:", req.body.sessionId);

  const { sessionId } = req.body;
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  // check idempotency key
  let idempotencyKey = await IdempotencyKey.findOne({
    $or: [
      { idempotencyKey: sessionId, status: "completed" },
      {
        idempotencyKey: sessionId,
        status: "pending",
        lockExpiry: { $gt: Date.now() },
      },
    ],
  });
  if (idempotencyKey) {
    return res.status(200).json({
      message: "Processing or completed payment session",
    });
  }
  if (idempotencyKey == null) {
    await IdempotencyKey.create({
      idempotencyKey: sessionId,
      status: "pending",
      lockExpiry: Date.now() + 24 * 60 * 60 * 1000,
    });
  }
  // Use a transaction to ensure all or none of the updates occur
  const mongooseSession = await mongoose.startSession();
  try {
    mongooseSession.startTransaction();

    if (session.payment_status === "paid") {
      if (session.metadata.couponCode) {
        await Coupon.findOneAndUpdate(
          {
            code: session.metadata.couponCode,
            userId: session.metadata.userId,
          },
          { isActive: false }
        );
      }
    }
    const products = JSON.parse(session.metadata.products);
    await updateProductStock(products, null, mongooseSession);

    // Create order only after successful stock update
    const newOrder = new Order({
      user: session.metadata.userId,
      products: products,
      totalAmount: session.amount_total / 100,
      stripeSessionId: sessionId,
      name: session.metadata.name,
      email: session.metadata.email,
      phone: session.metadata.phone,
      address: session.metadata.address,
    });

    // Save order and revert stock if order creation fails
    console.log("Attempting to save order to MongoDB...");
    const order = await newOrder.save();
    console.log("✓ Order saved successfully:", order._id);

    await User.findByIdAndUpdate(session.metadata.userId, {
      ShoppingBagItems: [],
    });
    console.log("✓ User shopping bag cleared successfully");

    await CheckoutSession.findOneAndUpdate(
      {
        sessionId: session.id,
        userId: req.user._id,
        status: "active",
      },
      { status: "completed" }
    );
    await IdempotencyKey.findOneAndUpdate({
      idempotencyKey: sessionId,
      status: "completed",
    });

    await mongooseSession.commitTransaction();

    console.log("=== CHECKOUT SUCCESS COMPLETED ===");
    return res.status(200).json({
      message:
        "Payment successful, order created, and coupon deactivated if used",
      orderId: order._id,
    });
  } catch (error) {
    // Rollback on failure
    await mongooseSession.abortTransaction();
    console.error("❌ Checkout success failed and rolled back:", error.message);
    // Re-throw the error to handle it in the calling function
    throw new Error(`Checkout success failed: ${error.message}`);
  } finally {
    mongooseSession.endSession();
  }
};
