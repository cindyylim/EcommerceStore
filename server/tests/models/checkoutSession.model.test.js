import { connectDB, disconnectDB, clearDB } from "../setup.js";
import CheckoutSession from "../../models/checkoutSession.model.js";
import mongoose from "mongoose";

describe("CheckoutSession Model Tests", () => {
    beforeAll(async () => {
        await connectDB();
    });

    afterAll(async () => {
        await disconnectDB();
    });

    beforeEach(async () => {
        await clearDB();
    });

    it("should create a checkout session successfully", async () => {
        const sessionData = {
            sessionId: "cs_12345",
            userId: new mongoose.Types.ObjectId(),
            expiresAt: new Date(Date.now() + 1000 * 60 * 30) // 30 mins
        };
        const session = await CheckoutSession.create(sessionData);
        expect(session.sessionId).toBe(sessionData.sessionId);
        expect(session.status).toBe("active");
    });

    it("should fail if required fields are missing", async () => {
        const session = new CheckoutSession({});
        try {
            await session.save();
        } catch (error) {
            expect(error.errors.sessionId).toBeDefined();
            expect(error.errors.userId).toBeDefined();
            expect(error.errors.expiresAt).toBeDefined();
        }
    });

    it("should fail if sessionId is not unique", async () => {
        const userId = new mongoose.Types.ObjectId();
        const expiresAt = new Date();
        await CheckoutSession.create({ sessionId: "dup", userId, expiresAt });
        const duplicate = new CheckoutSession({ sessionId: "dup", userId, expiresAt });
        try {
            await duplicate.save();
        } catch (error) {
            expect(error.code).toBe(11000);
        }
    });
});
