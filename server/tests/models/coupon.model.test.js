import { connectDB, disconnectDB, clearDB } from "../setup.js";
import Coupon from "../../models/coupon.model.js";
import mongoose from "mongoose";

describe("Coupon Model Tests", () => {
    beforeAll(async () => {
        await connectDB();
    });

    afterAll(async () => {
        await disconnectDB();
    });

    beforeEach(async () => {
        await clearDB();
    });

    it("should create a coupon successfully", async () => {
        const couponData = {
            code: "SAVE20",
            discountPercentage: 20,
            expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
            userId: new mongoose.Types.ObjectId()
        };
        const coupon = await Coupon.create(couponData);
        expect(coupon.code).toBe(couponData.code);
        expect(coupon.isActive).toBe(true);
    });

    it("should fail if required fields are missing", async () => {
        const coupon = new Coupon({});
        try {
            await coupon.save();
        } catch (error) {
            expect(error.errors.code).toBeDefined();
            expect(error.errors.discountPercentage).toBeDefined();
            expect(error.errors.expirationDate).toBeDefined();
            expect(error.errors.userId).toBeDefined();
        }
    });

    it("should fail if discountPercentage is out of range", async () => {
        const coupon = new Coupon({
            code: "INVALID",
            discountPercentage: 110,
            expirationDate: new Date(),
            userId: new mongoose.Types.ObjectId()
        });
        try {
            await coupon.save();
        } catch (error) {
            expect(error.errors.discountPercentage).toBeDefined();
        }
    });
});
