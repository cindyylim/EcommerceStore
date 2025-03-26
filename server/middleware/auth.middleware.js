import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

export const protectRoute = async (req, res, next) => {
  try {
    if (!req.cookies.accessToken) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No access token provided" });
    }
    try {
      const decoded = jwt.verify(
        req.cookies.accessToken,
        process.env.ACESS_TOKEN_SECRET
      );
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res
          .status(401)
          .json({ message: "Unauthorized - User not found" });
      }
      req.user = user;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Unauthorized - Access token expired" });
      }
      throw error;
    }
  } catch (error) {
    console.log("Error in protectRoute middleware", error.message);
    return res.status(401).json({ message: "Unauthorized - Invalid access token" });
  }
};

export const adminRoute = (req, res, next) => {
    if (req.user && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    next();
}