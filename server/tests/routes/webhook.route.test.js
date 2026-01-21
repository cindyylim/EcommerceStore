import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import { connectDB, disconnectDB, clearDB } from "../setup.js";

const mockConstructEvent = jest.fn();

// Mock Stripe
jest.unstable_mockModule("stripe", () => {
    return {
        default: jest.fn().mockImplementation(() => ({
            webhooks: {
                constructEvent: mockConstructEvent
            }
        }))
    };
});

const { default: webhookRoutes } = await import("../../routes/webhook.route.js");
const { default: CheckoutSession } = await import("../../models/checkoutSession.model.js");

const app = express();
// Webhook route uses express.raw, so we don't use express.json() here for the whole app
// but instead the route itself handles it.
app.use("/api/webhooks", webhookRoutes);

describe("Webhook Routes Tests", () => {
    beforeAll(async () => {
        await connectDB();
        process.env.STRIPE_SECRET_KEY = "sk_test";
        process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    });

    afterAll(async () => {
        await disconnectDB();
    });

    beforeEach(async () => {
        await clearDB();
        jest.clearAllMocks();
    });

    describe("POST /api/webhooks/stripe", () => {
        it("should handle checkout.session.expired", async () => {
            const sessionId = "cs_expired_123";
            await CheckoutSession.create({
                sessionId,
                userId: new (await import("mongoose")).default.Types.ObjectId(),
                status: "active",
                expiresAt: new Date(Date.now() + 1000 * 60)
            });

            mockConstructEvent.mockReturnValue({
                type: "checkout.session.expired",
                data: { object: { id: sessionId } }
            });

            const response = await request(app)
                .post("/api/webhooks/stripe")
                .set("stripe-signature", "valid_sig")
                .send({ id: "event_123" }); // Body doesn't matter due to mock

            expect(response.status).toBe(200);

            const updated = await CheckoutSession.findOne({ sessionId });
            expect(updated.status).toBe("expired");
        });
    });
});
