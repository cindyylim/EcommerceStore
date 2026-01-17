import { connectDB, disconnectDB, clearDB } from "./setup.js";
import Product from "../models/product.model.js";
import { reserveProducts } from "../utils/stockService.js";
import mongoose from "mongoose";

describe("Concurrency Payment Tests", () => {
    beforeAll(async () => {
        await connectDB();
    });

    afterAll(async () => {
        await disconnectDB();
    });

    beforeEach(async () => {
        await clearDB();
    });

    test("should prevent double booking when two users try to buy the last item simultaneously", async () => {
        // 1. Setup: Create a product with quantity 1
        const product = await Product.create({
            name: "Limited Edition Item",
            description: "Rare item",
            price: 100,
            image: "image.jpg",
            category: "test",
            quantity: 1, // Only 1 in stock
            inStock: true,
            hasSizes: false,
        });

        const productId = product._id;
        const session1 = "session_user_1";
        const session2 = "session_user_2";

        const productRequest = {
            _id: productId,
            quantity: 1,
            name: "Limited Edition Item",
        };

        // 2. Action: Simulate two concurrent requests trying to reserve the same product
        // We use Promise.allSettled to allow us to inspect both results even if one throws
        const results = await Promise.allSettled([
            reserveProducts([productRequest], session1),
            reserveProducts([productRequest], session2),
        ]);

        // 3. Assertion: Analyze results
        const fulfilled = results.filter((r) => r.status === "fulfilled");
        const rejected = results.filter((r) => r.status === "rejected");

        console.log(
            "Fulfilled:",
            fulfilled.length,
            "Rejected:",
            rejected.length
        );

        // One should succeed
        expect(fulfilled.length).toBe(1);
        // One should fail
        expect(rejected.length).toBe(1);

        // Verify the error message for the rejected one (optional but good)
        if (rejected.length > 0) {
            expect(rejected[0].reason.message).toMatch(
                /could not be reserved|insufficient stock|WriteConflict|Bulk operation failed/i
            );
        }

        // 4. Verification: Check database state
        const updatedProduct = await Product.findById(productId);

        expect(updatedProduct.quantity).toBe(1);
        expect(updatedProduct.reserved).toBe(1);
        expect(updatedProduct.reservations.length).toBe(1);
        expect(updatedProduct.reservations[0].cartSessionId).toBeDefined();
    });

    test("should prevent double booking for SIZED products", async () => {
        // 1. Setup: Create a product with quantity 1
        const product = await Product.create({
            name: "Limited Edition Shoe",
            description: "Rare shoe",
            price: 100,
            image: "shoe.jpg",
            category: "shoes",
            hasSizes: true,
            sizes: [
                { size: "M", quantity: 1, inStock: true, reserved: 0 }
            ],
            inStock: true
        });

        const productId = product._id;
        const session1 = "session_user_shoes_1";
        const session2 = "session_user_shoes_2";

        const productRequest = {
            _id: productId,
            quantity: 1,
            selectedSize: "M",
            name: "Limited Edition Shoe",
        };

        // 2. Action: Simulate two concurrent requests
        const results = await Promise.allSettled([
            reserveProducts([productRequest], session1),
            reserveProducts([productRequest], session2),
        ]);

        // 3. Assertion: Analyze results
        const fulfilled = results.filter((r) => r.status === "fulfilled");
        const rejected = results.filter((r) => r.status === "rejected");

        expect(fulfilled.length).toBe(1);
        expect(rejected.length).toBe(1);

        const updatedProduct = await Product.findById(productId);
        const sizeM = updatedProduct.sizes.find(s => s.size === "M");

        expect(sizeM.quantity).toBe(1);
        expect(sizeM.reserved).toBe(1);
        expect(sizeM.reservations.length).toBe(1);
        expect(updatedProduct.sizes[0].reservations[0].cartSessionId).toBeDefined();
    });
});
