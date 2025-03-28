import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { addToShoppingBag, getShoppingBagProducts, removeAllFromShoppingBag, updateQuantity } from "../controllers/shoppingbag.controller.js";

const router = express.Router();

router.get("/", protectRoute, getShoppingBagProducts);
router.post("/", protectRoute, addToShoppingBag);
router.delete("/", protectRoute, removeAllFromShoppingBag);
router.put("/:id", protectRoute, updateQuantity);

export default router;
