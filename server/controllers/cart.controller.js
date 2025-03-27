import Product from "../models/product.model.js";
import mongoose from "mongoose";

export const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;
    const existingItem = user.cartItems.find((item) => item.id === productId);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      user.cartItems.push({ _id: productId, quantity: 1 });
    }
    await user.save();
    res.status(200).json(user.cartItems);
  } catch (error) {
    console.log("Error in addToCart controller", error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const removeAllFromCart = async (req, res) => {
  try {
    const user = req.user;
    const { productId } = req.body;
    if (!productId) {
      user.cartItems = [];
    } else {
      user.cartItems = user.cartItems.filter((item) => item.id !== productId);
    }
    await user.save();
    res.status(200).json(user.cartItems);
  } catch (error) {
    console.log("Error in removeAllFromCart controller", error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const updateQuantity = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { quantity } = req.body;
    const user = req.user;
    const existingItem = user.cartItems.find((item) => item.id === productId);
    if (existingItem) {
      if (quantity === 0) {
        user.cartItems = user.cartItems.filter((item) => item.id !== productId);
      } else {
        existingItem.quantity = quantity;
      }
      await user.save();
      return res.status(200).json(user.cartItems);
    } else {
      return res.status(404).json({ message: "Product not found in cart" });
    }
  } catch (error) {
    console.log("Error in updateQuantity controller", error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const getCartProducts = async (req, res) => {
  try {
    const products = await Promise.all(
      req.user.cartItems.map(async (item) => {
        const product = await Product.findOne({ _id: new mongoose.Types.ObjectId(item._id) });
        return product;
      })
    );

    const cartItems = products
    .filter(product => product !== null) // Filter out null products
    .map((product) => {
      const item = req.user.cartItems.find(
        (item) => item._id.toString() === product._id.toString()
      );
      return {
        ...product.toJSON(),
        quantity: item.quantity,
      };
    });
    console.log(cartItems);
    return res.status(200).json(cartItems);
  } catch (error) {
    console.log("Error in getCartProducts controller", error.message);
    return res.status(500).json({ message: error.message });
  }
};
