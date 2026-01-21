import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import { connectDB, disconnectDB, clearDB } from "../setup.js";

// Mock Redis
jest.unstable_mockModule("../../lib/redis.js", () => ({
    redis: {
        set: jest.fn(),
        get: jest.fn(),
        del: jest.fn(),
        on: jest.fn()
    }
}));

const { default: authRoutes } = await import("../../routes/auth.route.js");
const { default: User } = await import("../../models/user.model.js");
const { redis } = await import("../../lib/redis.js");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);

describe("Auth Routes Tests", () => {
    beforeAll(async () => {
        await connectDB();
        process.env.ACESS_TOKEN_SECRET = "test_access_secret";
        process.env.REFRESH_TOKEN_SECRET = "test_refresh_secret";
    });

    afterAll(async () => {
        await disconnectDB();
    });

    beforeEach(async () => {
        await clearDB();
        jest.clearAllMocks();
    });

    describe("POST /api/auth/signup", () => {
        it("should create a new user and return user data with cookies", async () => {
            const signupData = {
                name: "Test User",
                email: "test@example.com",
                password: "password123"
            };

            const response = await request(app)
                .post("/api/auth/signup")
                .send(signupData);

            expect(response.status).toBe(201);
            expect(response.body.user.email).toBe(signupData.email);
            expect(response.header["set-cookie"]).toBeDefined();
            expect(redis.set).toHaveBeenCalled();
        });

        it("should return 400 if user already exists", async () => {
            await User.create({
                name: "Existing",
                email: "existing@example.com",
                password: "password123"
            });

            const response = await request(app)
                .post("/api/auth/signup")
                .send({
                    name: "New",
                    email: "existing@example.com",
                    password: "password123"
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("User already exists");
        });
    });

    describe("POST /api/auth/login", () => {
        it("should login successfully with valid credentials", async () => {
            await User.create({
                name: "Login User",
                email: "login@example.com",
                password: "password123"
            });

            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "login@example.com",
                    password: "password123"
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe("User logged in successfully.");
            expect(response.header["set-cookie"]).toBeDefined();
            expect(redis.set).toHaveBeenCalled();
        });

        it("should return 401 with invalid credentials", async () => {
            await User.create({
                name: "Login User",
                email: "login@example.com",
                password: "password123"
            });

            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "login@example.com",
                    password: "wrongpassword"
                });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Invalid credentials");
        });
    });

    describe("GET /api/auth/profile", () => {
        it("should return user profile when authenticated", async () => {
            const user = await User.create({
                name: "Profile User",
                email: "profile@example.com",
                password: "password123"
            });

            // Login to get cookies
            const loginResponse = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "profile@example.com",
                    password: "password123"
                });

            const cookies = loginResponse.header["set-cookie"];

            const response = await request(app)
                .get("/api/auth/profile")
                .set("Cookie", cookies);

            expect(response.status).toBe(200);
            expect(response.body.email).toBe(user.email);
        });

        it("should return 401 when not authenticated", async () => {
            const response = await request(app).get("/api/auth/profile");
            expect(response.status).toBe(401);
        });
    });

    describe("POST /api/auth/logout", () => {
        it("should logout successfully and clear cookies", async () => {
            const user = await User.create({ name: "U", email: "u@e.com", password: "password123" });
            const rt = (await import("jsonwebtoken")).default.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET);

            const response = await request(app)
                .post("/api/auth/logout")
                .set("Cookie", [`refreshToken=${rt}`]);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Logout successful");
            expect(redis.del).toHaveBeenCalled();
        });

        it("should logout even if refresh token is missing", async () => {
            const response = await request(app).post("/api/auth/logout");
            expect(response.status).toBe(200);
        });
    });

    describe("POST /api/auth/refresh-token", () => {
        it("should refresh token successfully", async () => {
            const user = await User.create({ name: "U", email: "u@e.com", password: "password123" });
            const rt = (await import("jsonwebtoken")).default.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET);

            redis.get.mockResolvedValue(rt);

            const response = await request(app)
                .post("/api/auth/refresh-token")
                .set("Cookie", [`refreshToken=${rt}`]);

            expect(response.status).toBe(200);
            expect(response.body.accessToken).toBeDefined();
        });

        it("should return 401 if refresh token mismatched", async () => {
            const user = await User.create({ name: "U", email: "u@e.com", password: "password123" });
            const rt = (await import("jsonwebtoken")).default.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET);

            redis.get.mockResolvedValue("different_token");

            const response = await request(app)
                .post("/api/auth/refresh-token")
                .set("Cookie", [`refreshToken=${rt}`]);

            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Invalid refresh token");
        });
    });
});
