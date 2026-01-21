import { connectDB, disconnectDB, clearDB } from "../setup.js";
import Wishlist from "../../models/wishlist.model.js";
import mongoose from "mongoose";

describe("Wishlist Model Tests", () => {
    beforeAll(async () => {
        await connectDB();
    });

    afterAll(async () => {
        await disconnectDB();
    });

    beforeEach(async () => {
        await clearDB();
    });

    it("should add a product to wishlist successfully", async () => {
        const wishlistData = {
            userId: new mongoose.Types.ObjectId(),
            productId: new mongoose.Types.ObjectId()
        };
        const item = await Wishlist.create(wishlistData);
        expect(item.userId).toEqual(wishlistData.userId);
        expect(item.productId).toEqual(wishlistData.productId);
    });

    it("should fail if required fields are missing", async () => {
        const item = new Wishlist({});
        try {
            await item.save();
        } catch (error) {
            expect(error.errors.userId).toBeDefined();
            expect(error.errors.productId).toBeDefined();
        }
    });

    it("should fail if duplicate product is added for same user", async () => {
        const userId = new mongoose.Types.ObjectId();
        const productId = new mongoose.Types.ObjectId();

        await Wishlist.create({ userId, productId });

        const duplicate = new Wishlist({ userId, productId });
        try {
            await duplicate.save();
        } catch (error) {
            expect(error.code).toBe(11000); // Duplicate key error
        }
    });
});
