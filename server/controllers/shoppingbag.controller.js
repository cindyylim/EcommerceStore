import Product from "../models/product.model.js";
import mongoose from "mongoose";

export const addToShoppingBag = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const existingItem = user.ShoppingBagItems.find(
      (item) => item._id.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      user.ShoppingBagItems.push({ _id: productId, quantity: 1 });
    }

    await user.save();
    res.status(200).json(user.ShoppingBagItems);
  } catch (error) {
    console.error("Error in addToShoppingBag controller:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const removeAllFromShoppingBag = async (req, res) => {
  try {
    const user = req.user;
    const { productId } = req.body;
    
    if (!productId) {
      user.ShoppingBagItems = [];
    } else {
      user.ShoppingBagItems = user.ShoppingBagItems.filter(
        (item) => item._id.toString() !== productId
      );
    }
    
    await user.save();
    res.status(200).json(user.ShoppingBagItems);
  } catch (error) {
    console.error("Error in removeAllFromShoppingBag controller:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const updateQuantity = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { quantity } = req.body;
    const user = req.user;

    if (quantity === 0) {
      user.ShoppingBagItems = user.ShoppingBagItems.filter(
        (item) => item._id.toString() !== productId
      );
    } else {
      const existingItem = user.ShoppingBagItems.find(
        (item) => item._id.toString() === productId
      );
      
      if (existingItem) {
        existingItem.quantity = quantity;
      } else {
        return res.status(404).json({ message: "Product not found in ShoppingBag" });
      }
    }

    await user.save();
    return res.status(200).json(user.ShoppingBagItems);
  } catch (error) {
    console.error("Error in updateQuantity controller:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getShoppingBagProducts = async (req, res) => {
  try {
    const products = await Promise.all(
      req.user.ShoppingBagItems.map(async (item) => {
        const product = await Product.findById(item._id);
        if (!product) return null;
        return {
          ...product.toJSON(),
          quantity: item.quantity,
        };
      })
    );

    const shoppingBagItems = products.filter(product => product !== null);
    return res.status(200).json(shoppingBagItems);
  } catch (error) {
    console.error("Error in getShoppingBagProducts controller:", error);
    return res.status(500).json({ message: error.message });
  }
};
