import express from "express";
import { expireSpecificSession } from "../utils/sessionExpiryService.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Admin endpoint to expire a specific checkout session
router.post("/expire-session", protectRoute, adminRoute, async (req, res) => {
  try {
    const { sessionUrl } = req.body;
    
    if (!sessionUrl) {
      return res.status(400).json({ 
        success: false, 
        message: "Session URL is required" 
      });
    }
    
    const result = await expireSpecificSession(sessionUrl);
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in admin expire-session endpoint:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

export default router;