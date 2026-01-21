import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import { connectDB, disconnectDB, clearDB } from "../setup.js";
import mongoose from "mongoose";

// Mock Redis
jest.unstable_mockModule("../../lib/redis.js", () => ({
    redis: {
        set: jest.fn(),
        get: jest.fn(),
        del: jest.fn(),
        on: jest.fn()
    }
}));

// Mock Cloudinary
jest.unstable_mockModule("../../lib/cloudinary.js", () => ({
    default: {
        uploader: {
            upload: jest.fn().mockResolvedValue({ secure_url: "http://test.image/url" }),
            destroy: jest.fn().mockResolvedValue({ result: "ok" })
        }
    }
}));

const { redis } = await import("../../lib/redis.js");
const { default: cloudinary } = await import("../../lib/cloudinary.js");
const { default: productRoutes } = await import("../../routes/product.route.js");
const { default: Product } = await import("../../models/product.model.js");
const { default: User } = await import("../../models/user.model.js");
const jwt = (await import("jsonwebtoken")).default;

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/products", productRoutes);

describe("Product Routes Tests", () => {
    let adminToken;
    let userToken;

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

        const user = await User.create({
            name: "User",
            email: "user@example.com",
            password: "password123",
            role: "customer"
        });
        userToken = jwt.sign({ userId: user._id }, process.env.ACESS_TOKEN_SECRET);
    });

    afterAll(async () => {
        await disconnectDB();
    });

    beforeEach(async () => {
        await Product.deleteMany({});
        jest.clearAllMocks();
    });

    describe("GET /api/products", () => {
        it("should return all products for admin", async () => {
            await Product.create({
                name: "P1", description: "D", price: 10, category: "C", image: "I"
            });
            const response = await request(app)
                .get("/api/products")
                .set("Cookie", [`accessToken=${adminToken}`]);
            expect(response.status).toBe(200);
            expect(response.body.products.length).toBe(1);
        });
    });

    describe("GET /api/products (with sorting)", () => {
        it("should return products sorted by price ascending", async () => {
            await Product.create([
                { name: "Cheap", price: 10, description: "D", category: "C", image: "I" },
                { name: "Expensive", price: 100, description: "D", category: "C", image: "I" }
            ]);

            const response = await request(app)
                .get("/api/products?sort=price-asc")
                .set("Cookie", [`accessToken=${adminToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.products[0].name).toBe("Cheap");
            expect(response.body.products[1].name).toBe("Expensive");
        });

        it("should return products sorted by price descending", async () => {
            await Product.create([
                { name: "Cheap", price: 10, description: "D", category: "C", image: "I" },
                { name: "Expensive", price: 100, description: "D", category: "C", image: "I" }
            ]);

            const response = await request(app)
                .get("/api/products?sort=price-desc")
                .set("Cookie", [`accessToken=${adminToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.products[0].name).toBe("Expensive");
            expect(response.body.products[1].name).toBe("Cheap");
        });
        it("should return products sorted by featured first", async () => {
            await Product.create([
                { name: "Cheap", price: 10, description: "D", category: "C", image: "I", isFeatured: true },
                { name: "Expensive", price: 100, description: "D", category: "C", image: "I" }
            ]);

            const response = await request(app)
                .get("/api/products?sort=featured")
                .set("Cookie", [`accessToken=${adminToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.products[0].name).toBe("Cheap");
            expect(response.body.products[1].name).toBe("Expensive");
        });

        it("should return products sorted by created time", async () => {
            await Product.create({ name: "Cheap", price: 10, description: "D", category: "C", image: "I" })
            await Product.create({ name: "Expensive", price: 100, description: "D", category: "C", image: "I" });

            const response = await request(app)
                .get("/api/products")
                .set("Cookie", [`accessToken=${adminToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.products[0].name).toBe("Expensive");
            expect(response.body.products[1].name).toBe("Cheap");
        });
    });

    describe("POST /api/products", () => {
        it("should create a new product", async () => {
            const productData = {
                name: "New", description: "D", price: 20, category: "C", image: "I", hasSizes: false, quantity: 5
            };
            const response = await request(app)
                .post("/api/products")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(productData);
            expect(response.status).toBe(201);
            expect(response.body.name).toBe("New");
        });
        it("should return 400 if create a new product with sizes has no sizes array", async () => {
            const productData = {
                name: "New", description: "D", price: 20, category: "C", image: "I", hasSizes: true, quantity: 5
            };
            const response = await request(app)
                .post("/api/products")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(productData);
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Sizes are required for products with sizes");
        });
    });

    describe("DELETE /api/products/:id", () => {
        it("should delete a product and its image", async () => {
            const product = await Product.create({
                name: "DeleteMe", description: "D", price: 10, category: "C", image: "http://res.cloudinary.com/test/image/upload/v123/products/img.jpg"
            });

            const response = await request(app)
                .delete(`/api/products/${product._id}`)
                .set("Cookie", [`accessToken=${adminToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Product deleted successfully");

            const deleted = await Product.findById(product._id);
            expect(deleted).toBeNull();
            expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(1);
        });

        it("should not delete a product if the product is not found", async () => {
            const newId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .delete(`/api/products/${newId}`)
                .set("Cookie", [`accessToken=${adminToken}`]);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Product not found");
        });
    });

    describe("PATCH /api/products/:id", () => {
        it("should toggle featured status", async () => {
            const product = await Product.create({ name: "P1", isFeatured: false, price: 10, description: "D", category: "C", image: "I" });

            const response = await request(app)
                .patch(`/api/products/${product._id}`)
                .set("Cookie", [`accessToken=${adminToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.isFeatured).toBe(true);
            expect(redis.set).toHaveBeenCalledTimes(1);
        });
        it("should not toggle featured status if product is not found", async () => {
            const newId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .patch(`/api/products/${newId}`)
                .set("Cookie", [`accessToken=${adminToken}`]);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Product not found");
        });
    });
    describe("PATCH /api/products/:productId/sizes", () => {
        it("should update product sizes", async () => {
            const product = await Product.create({ name: "P1", price: 10, description: "D", category: "C", image: "I", hasSizes: false });

            const response = await request(app)
                .patch(`/api/products/${product._id}/sizes`)
                .set("Cookie", [`accessToken=${adminToken}`])
                .send({
                    hasSizes: true,
                    sizes: [{ size: "L", quantity: 10 }]
                });

            expect(response.status).toBe(200);
            expect(response.body.hasSizes).toBe(true);
            expect(response.body.sizes[0].size).toBe("L");
            expect(response.body.sizes[0].quantity).toBe(10);
            expect(response.body.sizes[0].inStock).toBe(true);
        });

        it("should return 404 if product is not found", async () => {
            const newId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .patch(`/api/products/${newId}/sizes`)
                .set("Cookie", [`accessToken=${adminToken}`])
                .send({
                    hasSizes: true,
                    sizes: [{ size: "L", quantity: 10 }]
                });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Product not found");
        });

        it("should return 400 if sizes is not array with sizes", async () => {
            const product = await Product.create({ name: "P1", price: 10, description: "D", category: "C", image: "I", hasSizes: false });

            const response = await request(app)
                .patch(`/api/products/${product._id}/sizes`)
                .set("Cookie", [`accessToken=${adminToken}`])
                .send({
                    hasSizes: true,
                    sizes: []
                });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Sizes are required for products with sizes");
        });
    });

    describe("GET /api/products/featured", () => {
        it("should return featured products", async () => {
            await Product.create({ name: "F", description: "D", price: 10, category: "C", image: "I", isFeatured: true });
            const response = await request(app).get("/api/products/featured");
            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
        });
        it("should return 404 if no featured products", async () => {
            await Product.create({ name: "F", description: "D", price: 10, category: "C", image: "I", isFeatured: false });
            const response = await request(app).get("/api/products/featured");
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("No featured products found");
        });
    });

    describe("GET /api/products/search", () => {
        it("should return products matching query", async () => {
            await Product.create({ name: "SearchMe", description: "D", price: 10, category: "C", image: "I" });
            const response = await request(app).get("/api/products/search?q=Search");
            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
        });

        it("should return products matching query sorted by price ascending", async () => {
            await Product.create({ name: "SearchMe", description: "D", price: 10, category: "C", image: "I" });
            await Product.create({ name: "SearchMe2", description: "D", price: 100, category: "C", image: "I" });
            await Product.create({ name: "SearchMe3", description: "D", price: 1000, category: "C", image: "I" });

            const response = await request(app).get("/api/products/search?q=Search&sort=price-asc");
            expect(response.status).toBe(200);
            expect(response.body.length).toBe(3);
            expect(response.body[0].price).toBe(10);
            expect(response.body[1].price).toBe(100);
            expect(response.body[2].price).toBe(1000);
        });

        it("should return products matching query sorted by price descending", async () => {
            await Product.create({ name: "SearchMe", description: "D", price: 10, category: "C", image: "I" });
            await Product.create({ name: "SearchMe2", description: "D", price: 100, category: "C", image: "I" });
            await Product.create({ name: "SearchMe3", description: "D", price: 1000, category: "C", image: "I" });

            const response = await request(app).get("/api/products/search?q=Search&sort=price-desc");
            expect(response.status).toBe(200);
            expect(response.body.length).toBe(3);
            expect(response.body[0].price).toBe(1000);
            expect(response.body[1].price).toBe(100);
            expect(response.body[2].price).toBe(10);
        });

        it("should return products matching query sorted by creation time", async () => {
            await Product.create({ name: "SearchMe", description: "D", price: 10, category: "C", image: "I" });
            await Product.create({ name: "SearchMe2", description: "D", price: 100, category: "C", image: "I" });
            await Product.create({ name: "SearchMe3", description: "D", price: 1000, category: "C", image: "I" });

            const response = await request(app).get("/api/products/search?q=Search");
            expect(response.status).toBe(200);
            expect(response.body.length).toBe(3);
            expect(response.body[0].name).toBe("SearchMe3");
            expect(response.body[1].name).toBe("SearchMe2");
            expect(response.body[2].name).toBe("SearchMe");
        });

        it("should return products matching query sorted by featured", async () => {
            await Product.create({ name: "SearchMe", description: "D", price: 10, category: "C", image: "I", isFeatured: true });
            await Product.create({ name: "SearchMe2", description: "D", price: 100, category: "C", image: "I" });

            const response = await request(app).get("/api/products/search?q=Search&sort=featured");
            expect(response.status).toBe(200);
            expect(response.body.length).toBe(2);
            expect(response.body[0].name).toBe("SearchMe");
            expect(response.body[1].name).toBe("SearchMe2");
        });
    });


    describe("GET /api/products/recommendations", () => {
        it("should return 3 random products", async () => {
            await Product.create([
                { name: "P1", description: "D", price: 10, category: "C", image: "I" },
                { name: "P2", description: "D", price: 10, category: "C", image: "I" },
                { name: "P3", description: "D", price: 10, category: "C", image: "I" },
                { name: "P4", description: "D", price: 10, category: "C", image: "I" }
            ]);

            const response = await request(app).get("/api/products/recommendations");
            expect(response.status).toBe(200);
            expect(response.body.products.length).toBe(3);
        });
    });

    describe("GET /api/products/category/:category", () => {
        it("should return products by category", async () => {
            await Product.create({ name: "Shoe", category: "shoes", price: 10, description: "D", image: "I" });
            await Product.create({ name: "Shirt", category: "shirts", price: 10, description: "D", image: "I" });

            const response = await request(app).get("/api/products/category/shoes");
            expect(response.status).toBe(200);
            expect(response.body.products.length).toBe(1);
            expect(response.body.products[0].name).toBe("Shoe");
        });

        it("should return products by category sorted by price ascending", async () => {
            await Product.create({ name: "cheap", category: "shoes", price: 10, description: "D", image: "I" });
            await Product.create({ name: "expensive", category: "shoes", price: 100, description: "D", image: "I" });

            const response = await request(app).get("/api/products/category/shoes?sort=price-asc");
            expect(response.status).toBe(200);
            expect(response.body.products.length).toBe(2);
            expect(response.body.products[0].name).toBe("cheap");
            expect(response.body.products[1].name).toBe("expensive");
        });

        it("should return products by category sorted by price descending", async () => {
            await Product.create({ name: "cheap", category: "shoes", price: 10, description: "D", image: "I" });
            await Product.create({ name: "expensive", category: "shoes", price: 100, description: "D", image: "I" });

            const response = await request(app).get("/api/products/category/shoes?sort=price-desc");
            expect(response.status).toBe(200);
            expect(response.body.products.length).toBe(2);
            expect(response.body.products[0].name).toBe("expensive");
            expect(response.body.products[1].name).toBe("cheap");
        });

        it("should return products by category sorted by creation time", async () => {
            await Product.create({ name: "old", category: "shoes", price: 10, description: "D", image: "I" });
            await Product.create({ name: "newest", category: "shoes", price: 100, description: "D", image: "I" });

            const response = await request(app).get("/api/products/category/shoes");
            expect(response.status).toBe(200);
            expect(response.body.products.length).toBe(2);
            expect(response.body.products[0].name).toBe("newest");
            expect(response.body.products[1].name).toBe("old");
        });

        it("should return products by category sorted by featured", async () => {
            await Product.create({ name: "featured", category: "shoes", price: 10, description: "D", image: "I", isFeatured: true });
            await Product.create({ name: "not-featured", category: "shoes", price: 100, description: "D", image: "I" });

            const response = await request(app).get("/api/products/category/shoes?sort=featured");
            expect(response.status).toBe(200);
            expect(response.body.products.length).toBe(2);
            expect(response.body.products[0].name).toBe("featured");
            expect(response.body.products[1].name).toBe("not-featured");
        });
    });


    describe("GET /api/products/:productId", () => {
        it("should return product by ID", async () => {
            const product = await Product.create({ name: "P1", price: 10, description: "D", category: "C", image: "I" });

            const response = await request(app).get(`/api/products/${product._id}`);
            expect(response.status).toBe(200);
            expect(response.body.name).toBe("P1");
        });
        it("should return 404 if product not found", async () => {
            const newId = new mongoose.Types.ObjectId();

            const response = await request(app).get(`/api/products/${newId}`);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Product not found");
        });
    });
});
