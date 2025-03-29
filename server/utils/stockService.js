import Product from '../models/product.model.js';

export const updateProductStock = async (products) => {
  try {
    for (const item of products) {
      const product = await Product.findById(item.id);
      
      if (!product) {
        throw new Error(`Product not found: ${item.id}`);
      }

      if (product.hasSizes && item.size) {
        // Update size-specific stock
        const sizeIndex = product.sizes.findIndex(s => s.size === item.size);
        
        if (sizeIndex === -1) {
          throw new Error(`Size ${item.size} not found for product ${product.name}`);
        }

        // Ensure we have enough stock
        if (product.sizes[sizeIndex].quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name} in size ${item.size}`);
        }

        // Update the quantity for the specific size
        product.sizes[sizeIndex].quantity -= item.quantity;

        // Update inStock status if quantity reaches 0
        product.sizes[sizeIndex].inStock = product.sizes[sizeIndex].quantity > 0;

        // Check if all sizes are out of stock
        const allSizesOutOfStock = product.sizes.every(size => !size.inStock);
        if (allSizesOutOfStock) {
          product.inStock = false;
        }

      } else {
        // Update regular stock for products without sizes
        if (product.quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }

        product.quantity -= item.quantity;
        product.inStock = product.quantity > 0;
      }

      // Save the updated product
      await product.save();

      // Log stock update for monitoring
      console.log(`Updated stock for product ${product.name}:`, {
        productId: product._id,
        size: item.size || 'N/A',
        quantityReduced: item.quantity,
        newQuantity: product.hasSizes 
          ? product.sizes.find(s => s.size === item.size)?.quantity 
          : product.quantity
      });
    }
  } catch (error) {
    console.error('Error updating product stock:', error);
    throw error;
  }
};

// Optional: Add a function to revert stock changes in case of order failure
export const revertStockUpdate = async (products) => {
  try {

    for (const item of products) {
      const product = await Product.findById(item.id);
      
      if (!product) {
        console.error(`Cannot revert stock: Product not found: ${item.id}`);
        continue;
      }

      if (product.hasSizes && item.size) {
        const sizeIndex = product.sizes.findIndex(s => s.size === item.size);
        
        if (sizeIndex !== -1) {
          product.sizes[sizeIndex].quantity += item.quantity;
          product.sizes[sizeIndex].inStock = true;
          product.inStock = true;
        }
      } else {
        product.quantity += item.quantity;
        product.inStock = true;
      }

      await product.save();
      
      console.log(`Reverted stock for product ${product.name}:`, {
        productId: product._id,
        size: item.size || 'N/A',
        quantityRestored: item.quantity
      });
    }
  } catch (error) {
    console.error('Error reverting product stock:', error);
    throw error;
  }
}; 