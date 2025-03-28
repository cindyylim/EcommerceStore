import Product from "../models/product.model.js";
import mongoose from "mongoose";

export const addToShoppingBag = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;
    const existingItem = user.ShoppingBagItems.find((item) => item.id === productId);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      user.ShoppingBagItems.push({ _id: productId, quantity: 1 });
    }
    await user.save();
    res.status(200).json(user.ShoppingBagItems);
  } catch (error) {
    console.log("Error in addToShoppingBag controller", error.message);
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
      user.ShoppingBagItems = user.ShoppingBagItems.filter((item) => item.id !== productId);
    }
    await user.save();
    res.status(200).json(user.ShoppingBagItems);
  } catch (error) {
    console.log("Error in removeAllFromShoppingBag controller", error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const updateQuantity = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { quantity } = req.body;
    const user = req.user;
    const existingItem = user.ShoppingBagItems.find((item) => item.id === productId);
    if (existingItem) {
      if (quantity === 0) {
        user.ShoppingBagItems = user.ShoppingBagItems.filter((item) => item.id !== productId);
      } else {
        existingItem.quantity = quantity;
      }
      await user.save();
      return res.status(200).json(user.ShoppingBagItems);
    } else {
      return res.status(404).json({ message: "Product not found in ShoppingBag" });
    }
  } catch (error) {
    console.log("Error in updateQuantity controller", error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const getShoppingBagProducts = async (req, res) => {
  try {
    const products = await Promise.all(
      req.user.ShoppingBagItems.map(async (item) => {
        const product = await Product.findOne({ _id: new mongoose.Types.ObjectId(item._id) });
        return product;
      })
    );

    const ShoppingBagItems = products
    .filter(product => product !== null) // Filter out null products
    .map((product) => {
      const item = req.user.ShoppingBagItems.find(
        (item) => item._id.toString() === product._id.toString()
      );
      return {
        ...product.toJSON(),
        quantity: item.quantity,
      };
    });
    console.log(ShoppingBagItems);
    return res.status(200).json(ShoppingBagItems);
  } catch (error) {
    console.log("Error in getShoppingBagProducts controller", error.message);
    return res.status(500).json({ message: error.message });
  }
};
