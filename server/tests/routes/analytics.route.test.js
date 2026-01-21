import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import { connectDB, disconnectDB, clearDB } from "../setup.js";
import mongoose from "mongoose";

const { default: analyticsRoutes } = await import("../../routes/analytics.route.js");
const { default: Product } = await import("../../models/product.model.js");
const { default: User } = await import("../../models/user.model.js");
const { default: Order } = await import("../../models/order.model.js");
const jwt = (await import("jsonwebtoken")).default;

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/analytics", analyticsRoutes);

describe("Analytics Routes Tests", () => {
    let adminToken;

    beforeAll(async () => {
        await connectDB();
        process.env.ACESS_TOKEN_SECRET = "test_access_secret";

        const admin = await User.create({
            name: "Admin",
            email: "admin@example.com",
            password: "password123",
            role: "admin"
        });
        adminToken = jwt.sign({ userId: admin._id }, process.env.ACESS_TOKEN_SECRET);
    });

    afterAll(async () => {
        await disconnectDB();
    });

    describe("GET /api/analytics", () => {
        it("should return analytics data for admin", async () => {
            // Seed data
            await User.create({ name: "U1", email: "u1@ex.com", password: "password123" });
            await Product.create({ name: "P1", price: 10, category: "C", image: "I", description: "Desc" });
            await Order.create({
                user: new mongoose.Types.ObjectId(),
                products: [{ id: new mongoose.Types.ObjectId(), quantity: 1 }],
                totalAmount: 100,
                name: "O1", address: "A", email: "e", phone: "p"
            });

            const response = await request(app)
                .get("/api/analytics")
                .set("Cookie", [`accessToken=${adminToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.analyticsData.users).toBe(2); // admin + U1
            expect(response.body.analyticsData.products).toBe(1);
            expect(response.body.analyticsData.totalRevenue).toBe(100);
            expect(response.body.analyticsData.totalSales).toBe(1);
            expect(response.body.dailySalesData.length).toBe(8); // Current date + 7 previous days
        });

        it("should return 403 for non-admin", async () => {
            const user = await User.create({ name: "U", email: "u@ex.com", password: "password123" });
            const userToken = jwt.sign({ userId: user._id }, process.env.ACESS_TOKEN_SECRET);

            const response = await request(app)
                .get("/api/analytics")
                .set("Cookie", [`accessToken=${userToken}`]);

            expect(response.status).toBe(403);
        });
    });
});
