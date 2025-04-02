import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const protectRoute = async (req, res, next) => {
  try {
    if (!req.cookies.accessToken) {
      return res
        .status(401)
        .json({ message: "Please log in to continue" });
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
          .json({ message: "Please log in to continue" });
      }
      req.user = user;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Your session has expired. Please log in again" });
      }
      throw error;
    }
  } catch (error) {
    console.log("Error in protectRoute middleware", error.message);
    return res.status(401).json({ message: "Please log in to continue" });
  }
};

export const adminRoute = (req, res, next) => {
  if (req.user && req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }
  next();
}