import { connectDB, disconnectDB, clearDB } from "../setup.js";
import IdempotencyKey from "../../models/idempotencyKey.model.js";

describe("IdempotencyKey Model Tests", () => {
    beforeAll(async () => {
        await connectDB();
    });

    afterAll(async () => {
        await disconnectDB();
    });

    beforeEach(async () => {
        await clearDB();
    });

    it("should create an idempotency key successfully", async () => {
        const ikData = {
            idempotencyKey: "key_123",
            status: "pending"
        };
        const ik = await IdempotencyKey.create(ikData);
        expect(ik.idempotencyKey).toBe(ikData.idempotencyKey);
        expect(ik.status).toBe("pending");
    });

    it("should fail if idempotencyKey is missing", async () => {
        const ik = new IdempotencyKey({});
        try {
            await ik.save();
        } catch (error) {
            expect(error.errors.idempotencyKey).toBeDefined();
        }
    });

    it("should fail if idempotencyKey is not unique", async () => {
        await IdempotencyKey.create({ idempotencyKey: "dup" });
        const duplicate = new IdempotencyKey({ idempotencyKey: "dup" });
        try {
            await duplicate.save();
        } catch (error) {
            expect(error.code).toBe(11000);
        }
    });
});
