import { jest } from "@jest/globals";
import { connectDB, disconnectDB, clearDB } from "../setup.js";
import mongoose from "mongoose";

const mockRetrieve = jest.fn();
const mockExpire = jest.fn();

// Mock Stripe
jest.unstable_mockModule("stripe", () => {
    return {
        default: jest.fn().mockImplementation(() => ({
            checkout: {
                sessions: {
                    retrieve: mockRetrieve,
                    expire: mockExpire
                }
            }
        }))
    };
});

const { expireSpecificSession, expireCheckoutSessions } = await import("../../utils/sessionExpiryService.js");
const { default: CheckoutSession } = await import("../../models/checkoutSession.model.js");
const { default: User } = await import("../../models/user.model.js");
const { default: Stripe } = await import("stripe");

describe("Session Expiry Service Tests", () => {
    let mockStripe;

    beforeAll(async () => {
        await connectDB();
        mockStripe = new Stripe();
    });

    afterAll(async () => {
        await disconnectDB();
    });

    beforeEach(async () => {
        await clearDB();
        jest.clearAllMocks();
    });

    describe("expireSpecificSession", () => {
        it("should return false if session not found in database", async () => {
            const result = await expireSpecificSession("cs_test_not_found");
            expect(result.success).toBe(false);
            expect(result.message).toBe("Session not found in database");
        });

        it("should return false if session is already expired", async () => {
            await CheckoutSession.create({
                sessionId: "cs_expired",
                userId: new mongoose.Types.ObjectId(),
                status: "expired",
                expiresAt: new Date()
            });

            const result = await expireSpecificSession("cs_expired");
            expect(result.success).toBe(false);
            expect(result.message).toBe("Session is already expired");
        });

        it("should handle Stripe retrieval error and still expire locally", async () => {
            const sessionId = "cs_stripe_error";
            const session = await CheckoutSession.create({
                sessionId,
                userId: new mongoose.Types.ObjectId(),
                status: "active",
                expiresAt: new Date(Date.now() + 1000 * 60)
            });

            mockRetrieve.mockRejectedValue(new Error("Stripe error"));
            const result = await expireSpecificSession(sessionId);

            expect(result.success).toBe(true);
            expect(result.message).toContain("without product cleanup");

            const updated = await CheckoutSession.findById(session._id);
            expect(updated.status).toBe("expired");
        });

        it("should successfully expire session and clean up reservations", async () => {
            const { default: Product } = await import("../../models/product.model.js");
            const product = await Product.create({
                name: "Product to cleanup",
                description: "T",
                price: 10,
                image: "i",
                category: "C",
                quantity: 10,
                reserved: 2,
                reservations: [{ cartSessionId: "cs_cleanup", quantity: 2, reservedAt: new Date() }]
            });

            const sessionId = "cs_cleanup";
            await CheckoutSession.create({
                sessionId,
                userId: new mongoose.Types.ObjectId(),
                status: "active",
                expiresAt: new Date(Date.now() + 1000 * 60)
            });

            // Mock Stripe retrieve to succeed with metadata
            mockRetrieve.mockResolvedValue({
                id: sessionId,
                metadata: {
                    products: JSON.stringify([{ id: product._id, quantity: 2 }])
                }
            });

            const result = await expireSpecificSession(sessionId);

            expect(result.success).toBe(true);

            const updatedProduct = await Product.findById(product._id);
            expect(updatedProduct.reserved).toBe(0);
            expect(updatedProduct.reservations.length).toBe(0);
        });

        it("should extract session ID from a full Stripe URL", async () => {
            const sessionId = "cs_url_test";
            await CheckoutSession.create({
                sessionId,
                userId: new mongoose.Types.ObjectId(),
                status: "active",
                expiresAt: new Date(Date.now() + 1000 * 60)
            });
            mockRetrieve.mockResolvedValue({ id: sessionId, metadata: {} });

            const url = `https://checkout.stripe.com/pay/${sessionId}`;
            const result = await expireSpecificSession(url);
            expect(result.success).toBe(true);
            expect(result.sessionId).toBe(sessionId);
        });

        it("should return false for invalid session ID format", async () => {
            const result = await expireSpecificSession("invalid_id");
            expect(result.success).toBe(false);
            expect(result.message).toContain("Could not extract session ID");
        });

        it("should return false for invalid URL", async () => {
            const result = await expireSpecificSession("https://google.com");
            expect(result.success).toBe(false);
            expect(result.message).toContain("Could not extract session ID");
        });
    });

    describe("expireCheckoutSessions", () => {
        it("should return success message if no expired sessions found", async () => {
            const result = await expireCheckoutSessions();
            expect(result.success).toBe(true);
            expect(result.message).toBe("No expired sessions found");
            expect(result.expiredCount).toBe(0);
        });

        it("should process multiple expired sessions", async () => {
            const { default: Product } = await import("../../models/product.model.js");
            const p1 = await Product.create({
                name: "P1",
                description: "T",
                price: 10,
                image: "i",
                category: "C",
                quantity: 10,
                reserved: 1,
                reservations: [{ cartSessionId: "s1", quantity: 1, reservedAt: new Date() }]
            });

            const now = new Date();
            const past = new Date(now.getTime() - 1000 * 60); // 1 min ago

            await CheckoutSession.create([
                { sessionId: "s1", userId: new mongoose.Types.ObjectId(), status: "active", expiresAt: past },
                { sessionId: "s2", userId: new mongoose.Types.ObjectId(), status: "active", expiresAt: past }
            ]);

            mockRetrieve.mockImplementation((id) => {
                if (id === "s1") {
                    return Promise.resolve({
                        id: "s1",
                        metadata: { products: JSON.stringify([{ id: p1._id, quantity: 1 }]) }
                    });
                }
                return Promise.resolve({ id, metadata: {} });
            });

            const result = await expireCheckoutSessions();

            expect(result.success).toBe(true);
            expect(result.expiredCount).toBe(2);

            const updatedP1 = await Product.findById(p1._id);
            expect(updatedP1.reserved).toBe(0);
            expect(updatedP1.reservations.length).toBe(0);

            const s1 = await CheckoutSession.findOne({ sessionId: "s1" });
            const s2 = await CheckoutSession.findOne({ sessionId: "s2" });
            expect(s1.status).toBe("expired");
            expect(s2.status).toBe("expired");
        });
    });
});
