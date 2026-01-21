import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import { connectDB, disconnectDB, clearDB } from "../setup.js";
import mongoose from "mongoose";

const { default: couponRoutes } = await import("../../routes/coupon.route.js");
const { default: Coupon } = await import("../../models/coupon.model.js");
const { default: User } = await import("../../models/user.model.js");
const jwt = (await import("jsonwebtoken")).default;

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/coupons", couponRoutes);

describe("Coupon Routes Tests", () => {
    let user;
    let userToken;

    beforeAll(async () => {
        await connectDB();
        process.env.ACESS_TOKEN_SECRET = "test_access_secret";
    });

    afterAll(async () => {
        await disconnectDB();
    });

    beforeEach(async () => {
        await clearDB();
        user = await User.create({
            name: "Test User",
            email: "test@example.com",
            password: "password123"
        });
        userToken = jwt.sign({ userId: user._id }, process.env.ACESS_TOKEN_SECRET);
        jest.clearAllMocks();
    });

    describe("GET /api/coupons", () => {
        it("should return user's active coupon", async () => {
            const coupon = await Coupon.create({
                code: "DISCOUNT10",
                discountPercentage: 10,
                expirationDate: new Date(Date.now() + 1000 * 60 * 60),
                userId: user._id
            });

            const response = await request(app)
                .get("/api/coupons")
                .set("Cookie", [`accessToken=${userToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.code).toBe("DISCOUNT10");
        });

        it("should return null if no active coupon", async () => {
            const response = await request(app)
                .get("/api/coupons")
                .set("Cookie", [`accessToken=${userToken}`]);

            expect(response.status).toBe(200);
            expect(response.body).toBeNull();
        });
    });

    describe("POST /api/coupons/validate", () => {
        it("should validate a valid coupon", async () => {
            await Coupon.create({
                code: "VALIDCODE",
                discountPercentage: 15,
                expirationDate: new Date(Date.now() + 1000 * 60 * 60),
                userId: user._id
            });

            const response = await request(app)
                .post("/api/coupons/validate")
                .set("Cookie", [`accessToken=${userToken}`])
                .send({ code: "VALIDCODE" });

            expect(response.status).toBe(200);
            expect(response.body.code).toBe("VALIDCODE");
            expect(response.body.discountPercentage).toBe(15);
        });

        it("should return 404 if coupon is not found", async () => {
            const response = await request(app)
                .post("/api/coupons/validate")
                .set("Cookie", [`accessToken=${userToken}`])
                .send({ code: "VALIDCODE" });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Coupon not found");
        });

        it("should return 404 for expired coupon", async () => {
            await Coupon.create({
                code: "EXPIRED",
                discountPercentage: 15,
                expirationDate: new Date(Date.now() - 1000 * 60 * 60),
                userId: user._id
            });

            const response = await request(app)
                .post("/api/coupons/validate")
                .set("Cookie", [`accessToken=${userToken}`])
                .send({ code: "EXPIRED" });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Coupon expired");
        });
    });
});
