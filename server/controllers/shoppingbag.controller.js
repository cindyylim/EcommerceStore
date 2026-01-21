import Product from "../models/product.model.js";

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

      // Check available stock considering locks
      const availableQty = sizeObj.quantity - sizeObj.reserved;
      if (availableQty < 1) {
        return res
          .status(400)
          .json({ message: "Selected size is currently reserved by other customers" });
      }
    } else {
      // Check available stock for non-sized products
      const availableQty = product.quantity - product.reserved;
      if (availableQty < 1) {
        return res
          .status(400)
          .json({ message: "Product is currently reserved by other customers" });
      }
    }

    // Check if item with same product ID and size exists
    const normalizedSize = size || null;
    const existingItemIndex = user.ShoppingBagItems.findIndex(
      (item) => item._id.toString() === productId && item.size === normalizedSize
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

        let isAvailable = true;

        if (productDetails.hasSizes && item.size) {
          const sizeObj = productDetails.sizes.find(s => s.size === item.size);
          if (sizeObj) {
            const availableQty = sizeObj.quantity - sizeObj.reserved;
            isAvailable = availableQty > 0 && sizeObj.inStock;
          }
        } else {
          const availableQty = productDetails.quantity - productDetails.reserved;
          isAvailable = availableQty > 0 && productDetails.inStock;
        }

        return {
          ...productDetails.toJSON(),
          quantity: item.quantity,
          selectedSize: item.size,
          isAvailable: isAvailable,
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
      const normalizedSize = size || null;
      user.ShoppingBagItems = user.ShoppingBagItems.filter(
        (item) => !(item._id.toString() === productId && item.size === normalizedSize)
      );
    }

    await user.save();
    // Return full product details with size information
    const shoppingBagWithDetails = await Promise.all(
      user.ShoppingBagItems.map(async (item) => {
        const productDetails = await Product.findById(item._id);
        if (!productDetails) return null;

        let isAvailable = true;

        if (productDetails.hasSizes && item.size) {
          const sizeObj = productDetails.sizes.find(s => s.size === item.size);
          if (sizeObj) {
            const availableQty = sizeObj.quantity - sizeObj.reserved;
            isAvailable = availableQty > 0 && sizeObj.inStock;
          }
        } else {
          const availableQty = productDetails.quantity - productDetails.reserved;
          isAvailable = availableQty > 0 && productDetails.inStock;
        }

        return {
          ...productDetails.toJSON(),
          quantity: item.quantity,
          selectedSize: item.size,
          isAvailable: isAvailable,
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
      const normalizedSize = size || null;
      user.ShoppingBagItems = user.ShoppingBagItems.filter(
        (item) => !(item._id.toString() === productId && item.size === normalizedSize)
      );
    } else {
      const normalizedSize = size || null;
      const existingItem = user.ShoppingBagItems.find(
        (item) => item._id.toString() === productId && item.size === normalizedSize
      );

      if (existingItem) {
        // If increasing quantity, check stock availability
        if (quantity > existingItem.quantity) {
          const product = await Product.findById(productId);
          if (!product) {
            return res.status(404).json({ message: "Product not found" });
          }

          if (product.hasSizes) {
            const sizeObj = product.sizes.find(s => s.size === size);
            if (!sizeObj) {
              return res.status(400).json({ message: "Size not found" });
            }
            const availableQty = sizeObj.quantity - sizeObj.reserved;
            if (availableQty < quantity) {
              return res.status(400).json({
                message: `Cannot increase quantity. Only ${availableQty} available (some are reserved).`
              });
            }
          } else {
            const availableQty = product.quantity - product.reserved;
            if (availableQty < quantity) {
              return res.status(400).json({
                message: `Cannot increase quantity. Only ${availableQty} available (some are reserved).`
              });
            }
          }
        }
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

        let isAvailable = true;

        if (productDetails.hasSizes && item.size) {
          const sizeObj = productDetails.sizes.find(s => s.size === item.size);
          if (sizeObj) {
            const availableQty = sizeObj.quantity - sizeObj.reserved;
            isAvailable = availableQty > 0 && sizeObj.inStock;
          }
        } else {
          const availableQty = productDetails.quantity - productDetails.reserved;
          isAvailable = availableQty > 0 && productDetails.inStock;
        }

        return {
          ...productDetails.toJSON(),
          quantity: item.quantity,
          selectedSize: item.size,
          isAvailable: isAvailable,
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
            description: product.description,
            name: product.name,
            image: product.image,
            price: product.price,
            quantity: item.quantity,
            selectedSize: item.size,
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
          description: product.description,
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

          const availableQty = selectedSizeDetails.quantity - selectedSizeDetails.reserved;

          if (availableQty <= 0 && selectedSizeDetails.quantity > 0) {
            // Physically in stock but fully reserved
            return {
              ...baseProduct,
              isAvailable: false,
              errorMessage: "Size is currently reserved by others",
              shouldRemove: true,
            };
          }

          if (!selectedSizeDetails.inStock || selectedSizeDetails.quantity === 0) {
            return {
              ...baseProduct,
              isAvailable: false,
              errorMessage: "Size is out of stock",
              shouldRemove: true,
            };
          }

          if (availableQty < item.quantity) {
            return {
              ...baseProduct,
              isAvailable: false,
              errorMessage: "Not enough stock available (some reserved)",
              maxQuantity: availableQty,
              shouldAdjustQuantity: true,
            };
          }
        } else {
          // Non-sized product checks
          const availableQty = product.quantity - product.reserved;

          if (availableQty <= 0 && product.quantity > 0) {
            return {
              ...baseProduct,
              isAvailable: false,
              errorMessage: "Product is currently reserved by others",
              shouldRemove: false,
            };
          }

          if (availableQty < item.quantity) {
            return {
              ...baseProduct,
              isAvailable: false,
              errorMessage: "Not enough stock available (some reserved)",
              maxQuantity: availableQty,
              shouldAdjustQuantity: true,
            };
          }
        }

        // Product is available
        const realAvailableQty = product.hasSizes
          ? selectedSizeDetails.quantity - selectedSizeDetails.reserved
          : product.quantity - product.reserved;

        return {
          ...baseProduct,
          isAvailable: true,
          maxQuantity: realAvailableQty,
          stockWarning:
            realAvailableQty <= 5
              ? `Only ${realAvailableQty} left in stock`
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

