import Product from "../models/product.model.js";
import mongoose from "mongoose";

export const addToShoppingBag = async (req, res) => {
  try {
    const { productId, size } = req.body;
    const user = req.user;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Validate size if product has sizes
    if (product.hasSizes) {
      if (!size) {
        return res
          .status(400)
          .json({ message: "Size is required for this product" });
      }

      const sizeObj = product.sizes.find((s) => s.size === size);
      if (!sizeObj || !sizeObj.inStock) {
        return res
          .status(400)
          .json({ message: "Selected size is not available" });
      }
    }

    // Check if item with same product ID and size exists
    const existingItemIndex = user.ShoppingBagItems.findIndex(
      (item) => item._id.toString() === productId && item.size === size
    );
    if (existingItemIndex !== -1) {
      // Update existing item
      user.ShoppingBagItems[existingItemIndex].quantity += 1;
    } else {
      // Add new item with size
      user.ShoppingBagItems.push({
        _id: productId,
        quantity: 1,
        size: size || null, // Save size even if null
        addedAt: new Date(), // Optional: track when item was added
      });
    }

    await user.save();

    // Return full product details with size information
    const shoppingBagWithDetails = await Promise.all(
      user.ShoppingBagItems.map(async (item) => {
        const productDetails = await Product.findById(item._id);
        if (!productDetails) return null;

        return {
          ...productDetails.toJSON(),
          quantity: item.quantity,
          selectedSize: item.size,
          isAvailable: true,
        };
      })
    );

    const validItems = shoppingBagWithDetails.filter((item) => item !== null);
    return res.status(200).json(validItems);
  } catch (error) {
    console.error("Error in addToShoppingBag controller:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const removeAllFromShoppingBag = async (req, res) => {
  try {
    const user = req.user;
    const { productId, size } = req.body;

    if (!productId) {
      user.ShoppingBagItems = [];
    } else {
      user.ShoppingBagItems = user.ShoppingBagItems.filter(
        (item) => !(item._id.toString() === productId && item.size === size)
      );
    }

    await user.save();
    // Return full product details with size information
    const shoppingBagWithDetails = await Promise.all(
      user.ShoppingBagItems.map(async (item) => {
        const productDetails = await Product.findById(item._id);
        if (!productDetails) return null;

        return {
          ...productDetails.toJSON(),
          quantity: item.quantity,
          selectedSize: item.size,
          isAvailable: true,
        };
      })
    );
    res.status(200).json(shoppingBagWithDetails);
  } catch (error) {
    console.error("Error in removeAllFromShoppingBag controller:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const updateQuantity = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { quantity, size } = req.body;
    const user = req.user;

    if (quantity === 0) {
      user.ShoppingBagItems = user.ShoppingBagItems.filter(
        (item) => !(item._id.toString() === productId && item.size === size)
      );
    } else {
      const existingItem = user.ShoppingBagItems.find(
        (item) => item._id.toString() === productId && item.size === size
      );

      if (existingItem) {
        existingItem.quantity = quantity;
      } else {
        return res
          .status(404)
          .json({ message: "Product not found in ShoppingBag" });
      }
    }

    await user.save();
     // Return full product details with size information
     const shoppingBagWithDetails = await Promise.all(
      user.ShoppingBagItems.map(async (item) => {
        const productDetails = await Product.findById(item._id);
        if (!productDetails) return null;

        return {
          ...productDetails.toJSON(),
          quantity: item.quantity,
          selectedSize: item.size,
          isAvailable: true,
        };
      })
    );
    return res.status(200).json(shoppingBagWithDetails);
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
        if (!product) {
          return {
            _id: item._id,
            isAvailable: false,
            errorMessage: "Product no longer exists",
            shouldRemove: true,
          };
        }

        // Get the specific size object for the selected size
        const selectedSizeDetails =
          product.hasSizes && item.size
            ? product.sizes.find((s) => s.size === item.size)
            : null;

        // Base product info that's always included
        const baseProduct = {
          _id: product._id,
          name: product.name,
          image: product.image,
          price: product.price,
          quantity: item.quantity,
          selectedSize: item.size,
        };

        // Check various availability conditions
        if (product.hasSizes) {
          if (!selectedSizeDetails) {
            return {
              ...baseProduct,
              isAvailable: false,
              errorMessage: "Selected size is no longer available",
              shouldRemove: true,
            };
          }

          if (!selectedSizeDetails.inStock) {
            return {
              ...baseProduct,
              isAvailable: false,
              errorMessage: "Size is out of stock",
              shouldRemove: true,
            };
          }

          if (selectedSizeDetails.quantity < item.quantity) {
            return {
              ...baseProduct,
              isAvailable: false,
              errorMessage: "Not enough stock available",
              maxQuantity: selectedSizeDetails.quantity,
              shouldAdjustQuantity: true,
            };
          }
        }

        // Product is available
        return {
          ...baseProduct,
          description: product.description,
          isAvailable: true,
          maxQuantity: selectedSizeDetails
            ? selectedSizeDetails.quantity
            : null,
          stockWarning:
            selectedSizeDetails && selectedSizeDetails.quantity <= 5
              ? `Only ${selectedSizeDetails.quantity} left in stock`
              : null,
        };
      })
    );

    return res.status(200).json(products);
  } catch (error) {
    console.error("Error in getShoppingBagProducts controller:", error);
    return res.status(500).json({ message: error.message });
  }
};
