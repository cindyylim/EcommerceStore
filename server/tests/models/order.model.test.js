import { connectDB, disconnectDB, clearDB } from "../setup.js";
import Order from "../../models/order.model.js";
import mongoose from "mongoose";

describe("Order Model Tests", () => {
    beforeAll(async () => {
        await connectDB();
    });

    afterAll(async () => {
        await disconnectDB();
    });

    beforeEach(async () => {
        await clearDB();
    });

    it("should create an order successfully", async () => {
        const orderData = {
            user: new mongoose.Types.ObjectId(),
            products: [
                {
                    id: new mongoose.Types.ObjectId(),
                    quantity: 2,
                    size: "M"
                }
            ],
            totalAmount: 59.98,
            stripeSessionId: "cs_test_123",
            name: "Jane Doe",
            address: "123 Main St",
            email: "jane@example.com",
            phone: "555-1234"
        };
        const order = await Order.create(orderData);
        expect(order.name).toBe(orderData.name);
        expect(order.totalAmount).toBe(orderData.totalAmount);
        expect(order.products.length).toBe(1);
    });

    it("should fail if required fields are missing", async () => {
        const order = new Order({});
        try {
            await order.save();
        } catch (error) {
            expect(error.errors.user).toBeDefined();
            expect(error.errors.name).toBeDefined();
            expect(error.errors.address).toBeDefined();
            expect(error.errors.email).toBeDefined();
            expect(error.errors.phone).toBeDefined();
            expect(error.errors.totalAmount).toBeDefined();
        }
    });

    it("should fail if stripeSessionId is duplicated", async () => {
        const orderData = {
            user: new mongoose.Types.ObjectId(),
            products: [{ id: new mongoose.Types.ObjectId(), quantity: 1 }],
            totalAmount: 10,
            stripeSessionId: "duplicate_session",
            name: "User 1",
            address: "Addr 1",
            email: "user1@example.com",
            phone: "111-1111"
        };
        await Order.create(orderData);

        const duplicateOrder = new Order({
            ...orderData,
            name: "User 2",
            email: "user2@example.com"
        });

        try {
            await duplicateOrder.save();
        } catch (error) {
            expect(error.message).toBe("Order with this Stripe session ID already exists");
        }
    });
});
