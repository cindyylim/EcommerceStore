import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

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
            price: p.price,
          }))
        ),
        name: name,
        email: email,
        phone: phone,
        address: address,
      },
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
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

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
    const newOrder = new Order({
      user: session.metadata.userId,
      products: products.map((p) => ({
        product: p.id,
        quantity: p.quantity,
        price: p.price,
      })),
      totalAmount: session.amount_total / 100,
      stripeSessionId: sessionId,
      name: session.metadata.name,
      email: session.metadata.email,
      phone: session.metadata.phone,
      address: session.metadata.address,
    });
    await newOrder.save();
    return res.status(200).json({
      message:
        "Payment successful, order created, and coupon deactivated if used",
      orderId: newOrder._id,
    });
  } catch (error) {
    console.log("Error in checkoutSuccess controller", error.message);
    return res.status(500).json({ message: error.message });
  }
};
