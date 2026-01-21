import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import { connectDB, disconnectDB, clearDB } from "../setup.js";
import mongoose from "mongoose";

const mockStripeCreate = jest.fn();
const mockStripeRetrieve = jest.fn();
const mockStripeCouponsCreate = jest.fn();

// Mock Stripe
jest.unstable_mockModule("stripe", () => {
    return {
        default: jest.fn().mockImplementation(() => ({
            checkout: {
                sessions: {
                    create: mockStripeCreate,
                    retrieve: mockStripeRetrieve
                }
            },
            coupons: {
                create: mockStripeCouponsCreate
            }
        }))
    };
});

const { default: paymentRoutes } = await import("../../routes/payment.route.js");
const { default: Product } = await import("../../models/product.model.js");
const { default: User } = await import("../../models/user.model.js");
const { default: CheckoutSession } = await import("../../models/checkoutSession.model.js");
const { default: Order } = await import("../../models/order.model.js");
const { default: IdempotencyKey } = await import("../../models/idempotencyKey.model.js");
const jwt = (await import("jsonwebtoken")).default;

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/payments", paymentRoutes);

describe("Payment Routes Tests", () => {
    let user;
    let userToken;

    beforeAll(async () => {
        await connectDB();
        process.env.ACESS_TOKEN_SECRET = "test_access_secret";
        process.env.CLIENT_URL = "http://localhost:3000";
    });

    afterAll(async () => {
        await disconnectDB();
    });

    beforeEach(async () => {
        await clearDB();
        user = await User.create({
            name: "Test Buyer",
            email: "buyer@example.com",
            password: "password123"
        });
        userToken = jwt.sign({ userId: user._id }, process.env.ACESS_TOKEN_SECRET);
        jest.clearAllMocks();
    });

    describe("POST /api/payments/create-checkout-session", () => {
        it("should create a checkout session successfully for non-sized products", async () => {
            const product = await Product.create({
                name: "PayProduct", description: "D", price: 50, category: "C", image: "I", quantity: 10
            });

            mockStripeCreate.mockResolvedValue({ id: "cs_test_123" });

            const response = await request(app)
                .post("/api/payments/create-checkout-session")
                .set("Cookie", [`accessToken=${userToken}`])
                .send({
                    products: [{ ...product.toJSON(), quantity: 1 }],
                    name: "Recipient", email: "r@e.com", phone: "1", address: "A"
                });

            expect(response.status).toBe(200);
            expect(response.body.id).toBe("cs_test_123");
            expect(response.body.totalAmount).toBe(50);

            const sessionRec = await CheckoutSession.findOne({ sessionId: "cs_test_123" });
            expect(sessionRec).toBeDefined();

            await Product.findById(product._id).then((product) => {
                expect(product.quantity).toBe(10);
                expect(product.reserved).toBe(1);
                expect(product.reservations.length).toBe(1);
                expect(product.reservations[0].quantity).toBe(1);
                expect(product.reservations[0].cartSessionId).toBe("cs_test_123");
            })
        });

        it("should create a checkout session successfully for sized products", async () => {
            const product = await Product.create({
                name: "PayProduct", description: "D", price: 50, category: "C", image: "I", quantity: 20,
                sizes: [{ size: "XS", quantity: 10 }, { size: "S", quantity: 10 }]
            });

            mockStripeCreate.mockResolvedValue({ id: "cs_test_123" });

            const response = await request(app)
                .post("/api/payments/create-checkout-session")
                .set("Cookie", [`accessToken=${userToken}`])
                .send({
                    products: [{ _id: product._id, name: "PayProduct", selectedSize: "S", quantity: 1, image: "I", category: "C", description: "D", price: 50 }],
                    name: "Recipient", email: "r@e.com", phone: "1", address: "A"
                });

            expect(response.status).toBe(200);
            expect(response.body.id).toBe("cs_test_123");
            expect(response.body.totalAmount).toBe(50);

            const sessionRec = await CheckoutSession.findOne({ sessionId: "cs_test_123" });
            expect(sessionRec).toBeDefined();

            await Product.findById(product._id).then((product) => {
                expect(product.quantity).toBe(20);
                expect(product.sizes[1].quantity).toBe(10);
                expect(product.sizes[1].reserved).toBe(1);
                expect(product.sizes[1].reservations.length).toBe(1);
                expect(product.sizes[1].reservations[0].quantity).toBe(1);
                expect(product.sizes[1].reservations[0].cartSessionId).toBe("cs_test_123");
            })
        });

        it("should return 400 for empty products", async () => {
            const response = await request(app)
                .post("/api/payments/create-checkout-session")
                .set("Cookie", [`accessToken=${userToken}`])
                .send({ products: [] });

            expect(response.status).toBe(400);
        });

        it("should return 404 if cannot reserve non-sized product", async () => {
            const product = await Product.create({
                name: "PayProduct", description: "D", price: 50, category: "C", image: "I", quantity: 0
            });

            mockStripeCreate.mockResolvedValue({ id: "cs_test_123" });

            const response = await request(app)
                .post("/api/payments/create-checkout-session")
                .set("Cookie", [`accessToken=${userToken}`])
                .send({
                    products: [{ ...product.toJSON(), quantity: 1 }],
                    name: "Recipient", email: "r@e.com", phone: "1", address: "A"
                });

            const sessionRec = await CheckoutSession.findOne({ sessionId: "cs_test_123" });
            expect(sessionRec).toBeNull();

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Some products could not be reserved due to insufficient stock.")
        });

        it("should return 404 if cannot reserve sized product", async () => {
            const product = await Product.create({
                name: "PayProduct", description: "D", price: 50, category: "C", image: "I", quantity: 20,
                sizes: [{ size: "XS", quantity: 10 }, { size: "S", quantity: 0 }]
            });

            mockStripeCreate.mockResolvedValue({ id: "cs_test_123" });

            const response = await request(app)
                .post("/api/payments/create-checkout-session")
                .set("Cookie", [`accessToken=${userToken}`])
                .send({
                    products: [{ _id: product._id, name: "PayProduct", selectedSize: "S", quantity: 1, image: "I", category: "C", description: "D", price: 50 }],
                    name: "Recipient", email: "r@e.com", phone: "1", address: "A"
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Some products could not be reserved due to insufficient stock.")

            const sessionRec = await CheckoutSession.findOne({ sessionId: "cs_test_123" });
            expect(sessionRec).toBeNull();
        });
    });

    describe("POST /api/payments/checkout-success", () => {
        it("should handle successful checkout and create order for non-sized product", async () => {
            const product = await Product.create({
                name: "OrderProduct", description: "D", price: 50, category: "C", image: "I", quantity: 10, reserved: 1,
                reservations: [{ cartSessionId: "cs_test_123", quantity: 1, reservedAt: new Date() }]
            });

            mockStripeRetrieve.mockResolvedValue({
                id: "cs_test_123",
                payment_status: "paid",
                amount_total: 5000,
                metadata: {
                    userId: user._id.toString(),
                    products: JSON.stringify([{ id: product._id, quantity: 1 }]),
                    name: "Recipient", email: "r@e.com", phone: "1", address: "A"
                }
            });

            await CheckoutSession.create({
                sessionId: "cs_test_123",
                userId: user._id,
                status: "active",
                expiresAt: new Date(Date.now() + 1000 * 60)
            });

            const response = await request(app)
                .post("/api/payments/checkout-success")
                .set("Cookie", [`accessToken=${userToken}`])
                .send({ sessionId: "cs_test_123" });

            expect(response.status).toBe(200);
            expect(response.body.message).toContain("Payment successful");

            const order = await Order.findOne({ stripeSessionId: "cs_test_123" });
            expect(order).toBeDefined();

            const updatedProduct = await Product.findById(product._id);
            expect(updatedProduct.quantity).toBe(9);
            expect(updatedProduct.reserved).toBe(0);

            const userShoppingBag = await User.findOne({ _id: user._id }).select("ShoppingBagItems");
            expect(userShoppingBag['ShoppingBagItems']).toHaveLength(0);
        });

        it("should handle successful checkout and create order for sized product", async () => {
            const product = await Product.create({
                name: "OrderProduct", description: "D", price: 50, category: "C", image: "I", quantity: 11,
                sizes: [{ size: "XS", quantity: 10 }, { size: "S", quantity: 1, reserved: 1, reservations: [{ cartSessionId: "cs_test_123", quantity: 1, reservedAt: new Date() }] }],
            });

            mockStripeRetrieve.mockResolvedValue({
                id: "cs_test_123",
                payment_status: "paid",
                amount_total: 5000,
                metadata: {
                    userId: user._id.toString(),
                    products: JSON.stringify([{ id: product._id, quantity: 1, selectedSize: "S" }]),
                    name: "Recipient", email: "r@e.com", phone: "1", address: "A"
                }
            });

            await CheckoutSession.create({
                sessionId: "cs_test_123",
                userId: user._id,
                status: "active",
                expiresAt: new Date(Date.now() + 1000 * 60)
            });

            const response = await request(app)
                .post("/api/payments/checkout-success")
                .set("Cookie", [`accessToken=${userToken}`])
                .send({ sessionId: "cs_test_123" });

            expect(response.status).toBe(200);
            expect(response.body.message).toContain("Payment successful");

            const order = await Order.findOne({ stripeSessionId: "cs_test_123" });
            expect(order).toBeDefined();

            const updatedProduct = await Product.findById(product._id);
            expect(updatedProduct.sizes[1].quantity).toBe(0);
            expect(updatedProduct.sizes[1].reserved).toBe(0);
            expect(updatedProduct.sizes[1].reservations).toHaveLength(0);

            const userShoppingBag = await User.findOne({ _id: user._id }).select("ShoppingBagItems");
            expect(userShoppingBag['ShoppingBagItems']).toHaveLength(0);
        });

        it("should return idempotency message if processed twice", async () => {
            await IdempotencyKey.create({
                idempotencyKey: "cs_doubled",
                status: "completed"
            });

            const response = await request(app)
                .post("/api/payments/checkout-success")
                .set("Cookie", [`accessToken=${userToken}`])
                .send({ sessionId: "cs_doubled" });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Processing or completed payment session");
        });

        it("should return idempotency message if pending has not expired", async () => {
            await IdempotencyKey.create({
                idempotencyKey: "cs_doubled",
                status: "pending",
                lockExpiry: new Date(Date.now() + 1000 * 60 * 60 * 24)
            });

            const response = await request(app)
                .post("/api/payments/checkout-success")
                .set("Cookie", [`accessToken=${userToken}`])
                .send({ sessionId: "cs_doubled" });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Processing or completed payment session");
        });

        it("should not return idempotency message if pending expired", async () => {
            const product = await Product.create({
                name: "OrderProduct", description: "D", price: 50, category: "C", image: "I", quantity: 11,
                sizes: [{ size: "XS", quantity: 10 }, { size: "S", quantity: 1, reserved: 1, reservations: [{ cartSessionId: "cs_test_123", quantity: 1, reservedAt: new Date() }] }],
            });

            mockStripeRetrieve.mockResolvedValue({
                id: "cs_doubled",
                payment_status: "paid",
                amount_total: 5000,
                metadata: {
                    userId: user._id.toString(),
                    products: JSON.stringify([{ id: product._id, quantity: 1 }]),
                    name: "Recipient", email: "r@e.com", phone: "1", address: "A"
                }
            });

            await CheckoutSession.create({
                sessionId: "cs_doubled",
                userId: user._id,
                status: "active",
                expiresAt: new Date(Date.now() + 1000 * 60)
            });

            await IdempotencyKey.create({
                idempotencyKey: "cs_doubled",
                status: "pending",
                lockExpiry: new Date(Date.now() - 1000 * 60)
            });

            const response = await request(app)
                .post("/api/payments/checkout-success")
                .set("Cookie", [`accessToken=${userToken}`])
                .send({ sessionId: "cs_doubled" });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Payment successful, order created, and coupon deactivated if used");
        });
    });

    describe("POST /api/payments/create-checkout-session (with coupon and large order)", () => {
        it("should apply a coupon and generate a new one for large orders", async () => {
            const product = await Product.create({
                name: "Expensive Item", price: 250, description: "D", category: "C", image: "I", quantity: 10
            });

            const { default: Coupon } = await import("../../models/coupon.model.js");
            const coupon = await Coupon.create({
                code: "SAVE10", userId: user._id, discountPercentage: 10, expirationDate: new Date(Date.now() + 100000), isActive: true
            });

            mockStripeCreate.mockResolvedValue({ id: "cs_large_123" });
            mockStripeCouponsCreate.mockResolvedValue({ id: "stripe_cp_123" });

            const response = await request(app)
                .post("/api/payments/create-checkout-session")
                .set("Cookie", [`accessToken=${userToken}`])
                .send({
                    products: [{ ...product.toJSON(), quantity: 1 }],
                    couponCode: "SAVE10",
                    name: "Recipient", email: "r@e.com", phone: "1", address: "A"
                });

            expect(response.status).toBe(200);
            expect(response.body.totalAmount).toBe(225); // 250 - 10%

            // Check if a new coupon was created for the user (since > $200)
            const newCoupon = await Coupon.findOne({ userId: user._id, code: { $ne: "SAVE10" } });
            expect(newCoupon).toBeDefined();
            expect(newCoupon.code).toContain("GIFT");
        });
    });

    describe("POST /api/payments/checkout-success (error handling)", () => {
        it("should return 500 if Stripe retrieval fails", async () => {
            mockStripeRetrieve.mockRejectedValue(new Error("Stripe Error"));

            const response = await request(app)
                .post("/api/payments/checkout-success")
                .set("Cookie", [`accessToken=${userToken}`])
                .send({ sessionId: "cs_error" });

            expect(response.status).toBe(500);
        });
    });
});
