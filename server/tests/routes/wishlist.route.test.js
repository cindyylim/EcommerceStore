import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import { connectDB, disconnectDB, clearDB } from "../setup.js";
import mongoose from "mongoose";

const { default: wishlistRoutes } = await import("../../routes/wishlist.route.js");
const { default: Product } = await import("../../models/product.model.js");
const { default: User } = await import("../../models/user.model.js");
const { default: Wishlist } = await import("../../models/wishlist.model.js");
const jwt = (await import("jsonwebtoken")).default;

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/wishlist", wishlistRoutes);

describe("Wishlist Routes Tests", () => {
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

    describe("POST /api/wishlist", () => {
        it("should add a product to wishlist", async () => {
            const product = await Product.create({
                name: "P1",
                description: "D",
                price: 10,
                category: "C",
                image: "I"
            });

            const response = await request(app)
                .post("/api/wishlist")
                .set("Cookie", [`accessToken=${userToken}`])
                .send({ productId: product._id });

            expect(response.status).toBe(201);
            expect(response.body.name).toBe("P1");
        });

        it("should fail if product already in wishlist", async () => {
            const product = await Product.create({ name: "P1", description: "D", price: 10, category: "C", image: "I" });
            await Wishlist.create({ userId: user._id, productId: product._id });

            const response = await request(app)
                .post("/api/wishlist")
                .set("Cookie", [`accessToken=${userToken}`])
                .send({ productId: product._id });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Item already in wishlist");
        });
    });

    describe("GET /api/wishlist", () => {
        it("should get wishlist items", async () => {
            const product = await Product.create({ name: "P1", description: "D", price: 10, category: "C", image: "I" });
            await Wishlist.create({ userId: user._id, productId: product._id });

            const response = await request(app)
                .get("/api/wishlist")
                .set("Cookie", [`accessToken=${userToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].name).toBe("P1");
        });
    });

    describe("DELETE /api/wishlist/:productId", () => {
        it("should remove item from wishlist", async () => {
            const product = await Product.create({ name: "P1", description: "D", price: 10, category: "C", image: "I" });
            await Wishlist.create({ userId: user._id, productId: product._id });

            const response = await request(app)
                .delete(`/api/wishlist/${product._id}`)
                .set("Cookie", [`accessToken=${userToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Item removed from wishlist");
        });

        it("should return 404 if item is not found in wishlist", async () => {
            const product = await Product.create({ name: "P1", description: "D", price: 10, category: "C", image: "I" });

            const response = await request(app)
                .delete(`/api/wishlist/${product._id}`)
                .set("Cookie", [`accessToken=${userToken}`]);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Item not found in wishlist");
        });
    });
});
