import { jest } from "@jest/globals";
// Mock User model
jest.unstable_mockModule("../../models/user.model.js", () => ({
    default: {
        findById: jest.fn()
    }
}));

const { default: User } = await import("../../models/user.model.js");
const { protectRoute, adminRoute } = await import("../../middleware/auth.middleware.js");
import jwt from "jsonwebtoken";

describe("Auth Middleware Tests", () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            cookies: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe("protectRoute", () => {
        it("should return 401 if no accessToken cookie is present", async () => {
            await protectRoute(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Please log in to continue" });
            expect(next).not.toHaveBeenCalled();
        });

        it("should return 401 if token is expired", async () => {
            req.cookies.accessToken = "expired-token";
            const error = new Error("jwt expired");
            error.name = "TokenExpiredError";

            jest.spyOn(jwt, "verify").mockImplementation(() => {
                throw error;
            });

            await protectRoute(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Your session has expired. Please log in again" });
            expect(next).not.toHaveBeenCalled();
        });

        it("should return 401 if user is not found in database", async () => {
            req.cookies.accessToken = "valid-token";
            jest.spyOn(jwt, "verify").mockReturnValue({ userId: "user-id" });
            User.findById.mockResolvedValue(null);

            await protectRoute(req, res, next);

            expect(User.findById).toHaveBeenCalledWith("user-id");
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Please log in to continue" });
            expect(next).not.toHaveBeenCalled();
        });

        it("should call next() and set req.user if token is valid and user exists", async () => {
            req.cookies.accessToken = "valid-token";
            const mockUser = { _id: "user-id", name: "Test User" };
            jest.spyOn(jwt, "verify").mockReturnValue({ userId: "user-id" });
            User.findById.mockResolvedValue(mockUser);

            await protectRoute(req, res, next);

            expect(User.findById).toHaveBeenCalledWith("user-id");
            expect(req.user).toEqual(mockUser);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    describe("adminRoute", () => {
        it("should return 403 if user is not an admin", () => {
            req.user = { role: "customer" };
            adminRoute(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "Forbidden - Admin access required" });
            expect(next).not.toHaveBeenCalled();
        });

        it("should call next() if user is an admin", () => {
            req.user = { role: "admin" };
            adminRoute(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
    });
});
