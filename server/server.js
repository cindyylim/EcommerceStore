import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import shoppingBagRoutes from "./routes/shoppingbag.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import wishlistRoutes from "./routes/wishlist.route.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json({limit: '50mb'}));
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/shoppingBag", shoppingBagRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/wishlist", wishlistRoutes);

app.listen(PORT, () => {
  console.log("Server is running on port http://localhost:" + PORT);
  connectDB();
});
