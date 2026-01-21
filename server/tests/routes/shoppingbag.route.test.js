import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import { connectDB, disconnectDB, clearDB } from "../setup.js";
import mongoose from "mongoose";

const { default: shoppingBagRoutes } = await import("../../routes/shoppingbag.route.js");
const { default: Product } = await import("../../models/product.model.js");
const { default: User } = await import("../../models/user.model.js");
const jwt = (await import("jsonwebtoken")).default;

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/shoppingBag", shoppingBagRoutes);

describe("Shopping Bag Routes Tests", () => {
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

    describe("POST /api/shoppingBag", () => {
        it("should add a product to shopping bag", async () => {
            const product = await Product.create({
                name: "P1",
                description: "D",
                price: 10,
                category: "C",
                image: "I",
                quantity: 10
            });

            const response = await request(app)
                .post("/api/shoppingBag")
                .set("Cookie", [`accessToken=${userToken}`])
                .send({ productId: product._id });

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].name).toBe("P1");
        });

        it("should fail if product not found", async () => {
            const newId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .post("/api/shoppingBag")
                .set("Cookie", [`accessToken=${userToken}`])
                .send({ productId: newId });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Product not found");
        });

        it("should add a sized product to shopping bag", async () => {
            const product = await Product.create({
                name: "Sized",
                description: "D",
                price: 10,
                category: "C",
                image: "I",
                hasSizes: true,
                sizes: [{ size: "M", quantity: 5, inStock: true }]
            });

            const response = await request(app)
                .post("/api/shoppingBag")
                .set("Cookie", [`accessToken=${userToken}`])
                .send({ productId: product._id, size: "M" });

            expect(response.status).toBe(200);
            expect(response.body[0].selectedSize).toBe("M");
        });

        it("should increase quantity when adding same product", async () => {
            const product = await Product.create({
                name: "Sized",
                description: "D",
                price: 10,
                category: "C",
                image: "I",
                hasSizes: true,
                sizes: [{ size: "M", quantity: 5, inStock: true }]
            });

            const response = await request(app)
                .post("/api/shoppingBag")
                .set("Cookie", [`accessToken=${userToken}`])
                .send({ productId: product._id, size: "M" });

            const response2 = await request(app)
                .post("/api/shoppingBag")
                .set("Cookie", [`accessToken=${userToken}`])
                .send({ productId: product._id, size: "M" });

            const userShoppingBag = await User.findById(user._id).select("ShoppingBagItems");
            expect(userShoppingBag['ShoppingBagItems']).toHaveLength(1);
            expect(userShoppingBag['ShoppingBagItems'][0].quantity).toBe(2);
            expect(userShoppingBag['ShoppingBagItems'][0].size).toBe("M");
        });

        it("should fail if sized product is out of stock", async () => {
            const product = await Product.create({
                name: "Sized",
                description: "D",
                price: 10,
                category: "C",
                image: "I",
                hasSizes: true,
                sizes: [{ size: "M", quantity: 0, inStock: false }]
            });

            const response = await request(app)
                .post("/api/shoppingBag")
                .set("Cookie", [`accessToken=${userToken}`])
                .send({ productId: product._id, size: "M" });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Selected size is not available");
        });

        it("should fail if selected size product is reserved", async () => {
            const product = await Product.create({
                name: "Sized",
                description: "D",
                price: 10,
                category: "C",
                image: "I",
                hasSizes: true,
                sizes: [{ size: "M", quantity: 1, inStock: true, reserved: 1, reservations: { sessionId: "user-123" } }]
            });

            const response = await request(app)
                .post("/api/shoppingBag")
                .set("Cookie", [`accessToken=${userToken}`])
                .send({ productId: product._id, size: "M" });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Selected size is currently reserved by other customers");
        });

        it("should fail if product is out of stock", async () => {
            const product = await Product.create({
                name: "OOS",
                description: "D",
                price: 10,
                category: "C",
                image: "I",
                quantity: 1,
                reserved: 1,
                reservations: { sessionId: "user-123" }
            });

            const response = await request(app)
                .post("/api/shoppingBag")
                .set("Cookie", [`accessToken=${userToken}`])
                .send({ productId: product._id });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Product is currently reserved by other customers");
        });
    });

    describe("GET /api/shoppingBag", () => {
        it("should return shopping bag items with details", async () => {
            const product = await Product.create({
                name: "P1",
                description: "D",
                price: 10,
                category: "C",
                image: "I",
                quantity: 10
            });

            user.ShoppingBagItems.push({ _id: product._id, quantity: 2 });
            await user.save();

            const response = await request(app)
                .get("/api/shoppingBag")
                .set("Cookie", [`accessToken=${userToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].name).toBe("P1");
            expect(response.body[0].isAvailable).toBe(true);
        });

        it("should return shopping bag items with product is reserved warning for non-sized item", async () => {
            const product = await Product.create({
                name: "P1",
                description: "D",
                price: 10,
                category: "C",
                image: "I",
                quantity: 5,
                reserved: 5
            });

            user.ShoppingBagItems.push({ _id: product._id, quantity: 2 });
            await user.save();

            const response = await request(app)
                .get("/api/shoppingBag")
                .set("Cookie", [`accessToken=${userToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].name).toBe("P1");
            expect(response.body[0].isAvailable).toBe(false);
            expect(response.body[0].errorMessage).toBe("Product is currently reserved by others");
        });

        it("should return shopping bag items with not enough stock warning for non-sized item", async () => {
            const product = await Product.create({
                name: "P1",
                description: "D",
                price: 10,
                category: "C",
                image: "I",
                quantity: 5,
                reserved: 4
            });

            user.ShoppingBagItems.push({ _id: product._id, quantity: 2 });
            await user.save();

            const response = await request(app)
                .get("/api/shoppingBag")
                .set("Cookie", [`accessToken=${userToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].name).toBe("P1");
            expect(response.body[0].isAvailable).toBe(false);
            expect(response.body[0].errorMessage).toBe("Not enough stock available (some reserved)");
        });

        it("should return shopping bag items with selected size not available error", async () => {
            const product = await Product.create({
                name: "P1",
                description: "D",
                price: 10,
                category: "C",
                image: "I",
                hasSizes: true,
                sizes: [{ size: "M", quantity: 1, inStock: true, reserved: 1, reservations: { sessionId: "user-123" } }]
            });

            user.ShoppingBagItems.push({ _id: product._id, size: "XS", quantity: 1 });
            await user.save();

            const response = await request(app)
                .get("/api/shoppingBag")
                .set("Cookie", [`accessToken=${userToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].name).toBe("P1");
            expect(response.body[0].isAvailable).toBe(false);
            expect(response.body[0].errorMessage).toBe("Selected size is no longer available");
        });

        it("should return shopping bag items with size is currently reserved error", async () => {
            const product = await Product.create({
                name: "P1",
                description: "D",
                price: 10,
                category: "C",
                image: "I",
                hasSizes: true,
                sizes: [{ size: "M", quantity: 1, inStock: true, reserved: 1, reservations: { sessionId: "user-123" } }]
            });

            user.ShoppingBagItems.push({ _id: product._id, size: "M", quantity: 1 });
            await user.save();

            const response = await request(app)
                .get("/api/shoppingBag")
                .set("Cookie", [`accessToken=${userToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].name).toBe("P1");
            expect(response.body[0].isAvailable).toBe(false);
            expect(response.body[0].errorMessage).toBe("Size is currently reserved by others");
        });

        it("should return shopping bag items with size is out of stock error", async () => {
            const product = await Product.create({
                name: "P1",
                description: "D",
                price: 10,
                category: "C",
                image: "I",
                hasSizes: true,
                sizes: [{ size: "M", quantity: 0, inStock: false }]
            });

            user.ShoppingBagItems.push({ _id: product._id, size: "M", quantity: 1 });
            await user.save();

            const response = await request(app)
                .get("/api/shoppingBag")
                .set("Cookie", [`accessToken=${userToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].name).toBe("P1");
            expect(response.body[0].isAvailable).toBe(false);
            expect(response.body[0].errorMessage).toBe("Size is out of stock");
        });


        it("should return shopping bag items with not enough stock error for sized item", async () => {
            const product = await Product.create({
                name: "P1",
                description: "D",
                price: 10,
                category: "C",
                image: "I",
                hasSizes: true,
                sizes: [{ size: "M", quantity: 2, inStock: true, reserved: 1, reservations: { sessionId: "user-123" } }]
            });

            user.ShoppingBagItems.push({ _id: product._id, size: "M", quantity: 2 });
            await user.save();

            const response = await request(app)
                .get("/api/shoppingBag")
                .set("Cookie", [`accessToken=${userToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].name).toBe("P1");
            expect(response.body[0].isAvailable).toBe(false);
            expect(response.body[0].errorMessage).toBe("Not enough stock available (some reserved)");
        });
    });

    describe("DELETE /api/shoppingBag", () => {
        it("should remove all products from shopping bag", async () => {
            const product = await Product.create({ name: "P1", price: 10, description: "D", category: "C", image: "I", quantity: 10 });
            user.ShoppingBagItems.push({ _id: product._id, quantity: 1 });
            await user.save();

            const response = await request(app)
                .delete("/api/shoppingBag")
                .set("Cookie", [`accessToken=${userToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(0);
        });

        it("should remove a specific product from shopping bag", async () => {
            const p1 = await Product.create({ name: "P1", price: 10, description: "D", category: "C", image: "I", quantity: 10 });
            const p2 = await Product.create({ name: "P2", price: 10, description: "D", category: "C", image: "I", quantity: 10 });
            user.ShoppingBagItems.push({ _id: p1._id, quantity: 1 });
            user.ShoppingBagItems.push({ _id: p2._id, quantity: 1 });
            await user.save();

            const response = await request(app)
                .delete("/api/shoppingBag")
                .set("Cookie", [`accessToken=${userToken}`])
                .send({ productId: p1._id });

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].name).toBe("P2");
            expect(response.body[0].selectedSize).toBe(null);
            expect(response.body[0].quantity).toBe(1);
            expect(response.body[0].isAvailable).toBe(true);
        });

        it("should remove a specific sized product from shopping bag", async () => {
            const p1 = await Product.create({ name: "P1", price: 10, description: "D", category: "C", image: "I", quantity: 10, hasSizes: true, sizes: [{ size: "XS", quantity: 5, inStock: true }, { size: "M", quantity: 5, inStock: true }] });
            const p2 = await Product.create({ name: "P2", price: 10, description: "D", category: "C", image: "I", quantity: 10 });
            user.ShoppingBagItems.push({ _id: p1._id, size: "M", quantity: 1 });
            user.ShoppingBagItems.push({ _id: p1._id, size: "XS", quantity: 1 });
            await user.save();

            const response = await request(app)
                .delete("/api/shoppingBag")
                .set("Cookie", [`accessToken=${userToken}`])
                .send({ productId: p1._id, size: "M" });

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].name).toBe("P1");
            expect(response.body[0].selectedSize).toBe("XS");
            expect(response.body[0].quantity).toBe(1);
            expect(response.body[0].isAvailable).toBe(true);
        });
    });

    describe("Availability Logic in GET /api/shoppingBag", () => {
        it("should mark item as unavailable if reserved quantity exhausts stock", async () => {
            const product = await Product.create({
                name: "Limited", price: 10, description: "D", category: "C", image: "I",
                quantity: 1, reserved: 1 // Fully reserved by others
            });

            user.ShoppingBagItems.push({ _id: product._id, quantity: 1 });
            await user.save();

            const response = await request(app)
                .get("/api/shoppingBag")
                .set("Cookie", [`accessToken=${userToken}`]);

            expect(response.status).toBe(200);
            expect(response.body[0].isAvailable).toBe(false);
        });

        it("should mark sized item as unavailable if size stock is exhausted", async () => {
            const product = await Product.create({
                name: "SizedLimited", price: 10, description: "D", category: "C", image: "I",
                hasSizes: true,
                sizes: [{ size: "S", quantity: 1, reserved: 1, inStock: true }]
            });

            user.ShoppingBagItems.push({ _id: product._id, quantity: 1, size: "S" });
            await user.save();

            const response = await request(app)
                .get("/api/shoppingBag")
                .set("Cookie", [`accessToken=${userToken}`]);

            expect(response.status).toBe(200);
            expect(response.body[0].isAvailable).toBe(false);
        });
        describe("PUT /api/shoppingBag/:id", () => {
            it("should update quantity", async () => {
                const product = await Product.create({
                    name: "P1",
                    description: "D",
                    price: 10,
                    category: "C",
                    image: "I",
                    quantity: 10
                });

                user.ShoppingBagItems.push({ _id: product._id, quantity: 1 });
                await user.save();

                const response = await request(app)
                    .put(`/api/shoppingBag/${product._id}`)
                    .set("Cookie", [`accessToken=${userToken}`])
                    .send({ quantity: 3 });

                expect(response.status).toBe(200);
                expect(response.body[0].quantity).toBe(3);
                expect(response.body[0].isAvailable).toBe(true);
                expect(response.body[0].selectedSize).toBe(null);
            });

            it("should remove item if quantity is 0", async () => {
                const product = await Product.create({
                    name: "P1",
                    description: "D",
                    price: 10,
                    category: "C",
                    image: "I",
                    quantity: 10
                });

                user.ShoppingBagItems.push({ _id: product._id, quantity: 1 });
                await user.save();

                const response = await request(app)
                    .put(`/api/shoppingBag/${product._id}`)
                    .set("Cookie", [`accessToken=${userToken}`])
                    .send({ quantity: 0 });

                expect(response.status).toBe(200);
                expect(response.body).toHaveLength(0);
            });

            it("should return 400 if quantity is reserved", async () => {
                const product = await Product.create({
                    name: "P1",
                    description: "D",
                    price: 10,
                    category: "C",
                    image: "I",
                    quantity: 2,
                    reserved: 1
                });

                user.ShoppingBagItems.push({ _id: product._id, quantity: 1 });
                await user.save();

                const response = await request(app)
                    .put(`/api/shoppingBag/${product._id}`)
                    .set("Cookie", [`accessToken=${userToken}`])
                    .send({ quantity: 2 });

                expect(response.status).toBe(400);
                expect(response.body.message).toBe("Cannot increase quantity. Only 1 available (some are reserved).")
            });

            it("should return 400 if quantity is reserved for sized product", async () => {
                const product = await Product.create({
                    name: "P1",
                    description: "D",
                    price: 10,
                    category: "C",
                    image: "I",
                    hasSizes: true,
                    sizes: [{ size: "S", quantity: 2, reserved: 1, inStock: true }]
                });

                user.ShoppingBagItems.push({ _id: product._id, quantity: 1, size: "S" });
                await user.save();

                const response = await request(app)
                    .put(`/api/shoppingBag/${product._id}`)
                    .set("Cookie", [`accessToken=${userToken}`])
                    .send({ quantity: 2, size: "S" });

                expect(response.status).toBe(400);
                expect(response.body.message).toBe("Cannot increase quantity. Only 1 available (some are reserved).")
            });
        });
    });
});
