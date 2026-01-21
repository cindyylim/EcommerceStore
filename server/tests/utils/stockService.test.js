import { connectDB, disconnectDB, clearDB } from "../setup.js";
import Product from "../../models/product.model.js";
import { reserveProducts, updateProductStock } from "../../utils/stockService.js";

describe("Stock Service Tests", () => {
    beforeAll(async () => {
        await connectDB();
    });

    afterAll(async () => {
        await disconnectDB();
    });

    beforeEach(async () => {
        await clearDB();
    });

    describe("reserveProducts", () => {
        it("should successfully reserve a non-sized product", async () => {
            const product = await Product.create({
                name: "Test Product",
                description: "Test",
                price: 10,
                image: "img",
                category: "Test",
                quantity: 10,
                reserved: 0
            });

            const sessionId = "session_123";
            const productsToReserve = [{ _id: product._id, quantity: 2 }];

            const result = await reserveProducts(productsToReserve, sessionId);

            expect(result.modifiedCount).toBe(1);

            const updatedProduct = await Product.findById(product._id);
            expect(updatedProduct.reserved).toBe(2);
            expect(updatedProduct.reservations.length).toBe(1);
            expect(updatedProduct.reservations[0].cartSessionId).toBe(sessionId);
        });

        it("should successfully reserve a sized product", async () => {
            const product = await Product.create({
                name: "Sized Product",
                description: "Test",
                price: 10,
                image: "img",
                category: "Test",
                hasSizes: true,
                sizes: [
                    { size: "S", quantity: 5, reserved: 0 },
                    { size: "M", quantity: 5, reserved: 0 }
                ]
            });

            const sessionId = "session_sized";
            const productsToReserve = [{ _id: product._id, quantity: 2, selectedSize: "S" }];

            const result = await reserveProducts(productsToReserve, sessionId);

            expect(result.modifiedCount).toBe(1);

            const updatedProduct = await Product.findById(product._id);
            const sizeS = updatedProduct.sizes.find(s => s.size === "S");
            expect(sizeS.reserved).toBe(2);
            expect(sizeS.reservations.length).toBe(1);
            expect(updatedProduct.reserved).toBe(2); // Root level aggregate
        });

        it("should rollback if one product in batch cannot be reserved", async () => {
            const p1 = await Product.create({
                name: "P1",
                description: "T",
                price: 10,
                image: "i",
                category: "C",
                quantity: 10
            });
            const p2 = await Product.create({
                name: "P2",
                description: "T",
                price: 10,
                image: "i",
                category: "C",
                quantity: 1 // Only 1 available
            });

            const sessionId = "session_fail";
            const productsToReserve = [
                { _id: p1._id, quantity: 2 },
                { _id: p2._id, quantity: 2 } // Request 2, but only 1 available
            ];

            await expect(reserveProducts(productsToReserve, sessionId))
                .rejects.toThrow("Some products could not be reserved due to insufficient stock.");

            // Verify rollback
            const updatedP1 = await Product.findById(p1._id);
            expect(updatedP1.reserved).toBe(0);
        });
    });

    describe("updateProductStock", () => {
        it("should deduct stock after successful purchase for non-sized product", async () => {
            // First reserve it
            const product = await Product.create({
                name: "Purchase Product",
                description: "T",
                price: 10,
                image: "i",
                category: "C",
                quantity: 10,
                reserved: 2,
                reservations: [{ cartSessionId: "session_buy", quantity: 2, reservedAt: new Date() }]
            });

            const sessionId = "session_buy";
            const purchaseData = [{ _id: product._id, quantity: 2 }];

            await updateProductStock(purchaseData, sessionId);

            const updatedProduct = await Product.findById(product._id);
            expect(updatedProduct.quantity).toBe(8);
            expect(updatedProduct.reserved).toBe(0);
            expect(updatedProduct.reservations.length).toBe(0);
        });

        it("should deduct stock for sized product", async () => {
            const product = await Product.create({
                name: "Sized Purchase",
                description: "T",
                price: 10,
                image: "i",
                category: "C",
                hasSizes: true,
                sizes: [
                    {
                        size: "M",
                        quantity: 5,
                        reserved: 2,
                        reservations: [{ cartSessionId: "session_buy_sized", quantity: 2, reservedAt: new Date() }]
                    }
                ],
                quantity: 5,
                reserved: 2
            });

            const purchaseData = [{ _id: product._id, quantity: 2, selectedSize: "M" }];
            await updateProductStock(purchaseData, "session_buy_sized");

            const updatedProduct = await Product.findById(product._id);
            const sizeM = updatedProduct.sizes.find(s => s.size === "M");
            expect(sizeM.quantity).toBe(3);
            expect(sizeM.reserved).toBe(0);
            expect(updatedProduct.quantity).toBe(3);
        });
    });
});
