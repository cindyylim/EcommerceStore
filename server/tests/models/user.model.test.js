import { connectDB, disconnectDB, clearDB } from "../setup.js";
import User from "../../models/user.model.js";
import mongoose from "mongoose";

describe("User Model Tests", () => {
    beforeAll(async () => {
        await connectDB();
    });

    afterAll(async () => {
        await disconnectDB();
    });

    beforeEach(async () => {
        await clearDB();
    });

    it("should create a user successfully", async () => {
        const userData = {
            name: "John Doe",
            email: "john@example.com",
            password: "password123"
        };
        const user = await User.create(userData);
        expect(user.name).toBe(userData.name);
        expect(user.email).toBe(userData.email);
        expect(user.password).not.toBe(userData.password); // Should be hashed
        expect(user.role).toBe("customer"); // Default role
    });

    it("should fail to create a user without required fields", async () => {
        const user = new User({});
        try {
            await user.save();
        } catch (error) {
            expect(error.errors.name).toBeDefined();
            expect(error.errors.email).toBeDefined();
            expect(error.errors.password).toBeDefined();
        }
    });

    it("should fail to create a user with duplicate email", async () => {
        const userData = {
            name: "John Doe",
            email: "john@example.com",
            password: "password123"
        };
        await User.create(userData);

        const duplicateUser = new User(userData);
        try {
            await duplicateUser.save();
        } catch (error) {
            expect(error.code).toBe(11000); // MongoDB duplicate key error code
        }
    });

    it("should properly hash the password before saving", async () => {
        const password = "mysecretpassword";
        const user = await User.create({
            name: "Test User",
            email: "test@example.com",
            password
        });
        expect(user.password).not.toBe(password);
        expect(user.password.length).toBeGreaterThan(20);
    });

    it("should correctly compare passwords", async () => {
        const password = "mysecretpassword";
        const user = await User.create({
            name: "Test User",
            email: "test@example.com",
            password
        });

        const isMatch = await user.comparePassword(password);
        const isNotMatch = await user.comparePassword("wrongpassword");

        expect(isMatch).toBe(true);
        expect(isNotMatch).toBe(false);
    });
});
