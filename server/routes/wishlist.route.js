import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getWishlistItems, addToWishlist, removeFromWishlist } from "../controllers/wishlist.controller.js";

const router = express.Router();

// Get user's wishlist items
router.get('/', protectRoute, getWishlistItems);

// Add item to wishlist
router.post('/', protectRoute, addToWishlist);

// Remove item from wishlist
router.delete('/:productId', protectRoute, removeFromWishlist);

export default router;