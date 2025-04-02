import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file first
dotenv.config({ path: path.join(__dirname, '../.env') });

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import shoppingBagRoutes from "./routes/shoppingbag.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import adminRoutes from "./routes/admin.route.js";
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import wishlistRoutes from "./routes/wishlist.route.js";
import webhookRoutes from "./routes/webhook.route.js";
import { startScheduler } from "./utils/scheduler.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend
app.use(cors({
  origin: "http://localhost:5173", // Frontend URL
  credentials: true // Allow cookies
}));

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/shoppingBag", shoppingBagRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/admin", adminRoutes);

// Connect to MongoDB first, then start the server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log("Server is running on port http://localhost:" + PORT);

      // Start the new scheduler for checkout session expiry and lock cleanup
      startScheduler();
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  });
