import { redis } from "../lib/redis.js";
import Product from "../models/product.model.js";
import cloudinary from "../lib/cloudinary.js";

export const getAllProducts = async (req, res) => {
  try {
    const { sort } = req.query;
    let query = Product.find();
    
    // Apply sorting based on the sort parameter
    switch (sort) {
      case 'featured':
        query = query.sort({ isFeatured: -1, name: 1 });
        break;
      case 'price-asc':
        query = query.sort({ price: 1 });
        break;
      case 'price-desc':
        query = query.sort({ price: -1 });
        break;
      default:
        query = query.sort({ createdAt: -1 }); // Default sort by newest
    }

    const products = await query;
    return res.status(200).json({ products });
  } catch (error) {
    console.log("Error in getAllProducts controller", error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    let featuredProducts = await redis.get("featured_products");
    if (featuredProducts) {
      return res.json(JSON.parse(featuredProducts));
    }
    featuredProducts = await Product.find({ isFeatured: true }).lean();
    if (!featuredProducts) {
      return res.status(404).json({ message: "No featured products found" });
    }
    await redis.set("featured_products", JSON.stringify(featuredProducts));
    return res.json(featuredProducts);
  } catch (error) {
    console.log("Error in getFeaturedProducts controller", error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category, isFeatured, sizes, hasSizes } = req.body;
    let cloudinaryResponse = null;

    if (image) {
      cloudinaryResponse = await cloudinary.uploader.upload(image, {
        folder: "products",
      });
    }

    // Validate sizes if hasSizes is true
    if (hasSizes && (!sizes || !Array.isArray(sizes) || sizes.length === 0)) {
      return res.status(400).json({ message: "Sizes are required for products with sizes" });
    }

    const product = await Product.create({
      name,
      description,
      price,
      image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
      category,
      isFeatured,
      hasSizes,
      sizes: hasSizes ? sizes : []
    });
    return res.status(201).json(product);
  } catch (error) {
    console.log("Error in createProduct controller", error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (product.image) {
      const publicId = product.image.split("/").pop().split(".")[0];
      try {
        await cloudinary.uploader.destroy(publicId);
        console.log("deleted image from cloudinary");
      } catch (error) {
        console.log("Error in deleting image from cloudinary", error.message);
        throw error;
      }
    }
    await Product.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.log("Error in deleteProduct controller", error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const getRecommendedProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $sample: { size: 3 },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          image: 1,
          price: 1,
        },
      },
    ]);
    return res.status(200).json({ products });
  } catch (error) {
    console.log("Error in getRecommendedProducts controller", error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  const { category } = req.params;
  const { sort } = req.query;
  
  try {
    let query = Product.find({ category });
    
    // Apply sorting based on the sort parameter
    switch (sort) {
      case 'featured':
        query = query.sort({ isFeatured: -1, name: 1 });
        break;
      case 'price-asc':
        query = query.sort({ price: 1 });
        break;
      case 'price-desc':
        query = query.sort({ price: -1 });
        break;
      default:
        query = query.sort({ createdAt: -1 }); // Default sort by newest
    }

    const products = await query;
    return res.status(200).json({ products });
  } catch (error) {
    console.log("Error in getProductsByCategory controller", error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const toggleFeaturedProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      product.isFeatured = !product.isFeatured;
      const updatedProduct = await product.save();
      await updateFeaturedProductsCache();
      return res.status(200).json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.log("Error in toggleFeaturedProduct controller", error.message);
    return res.status(500).json({ message: error.message });
  }
};

async function updateFeaturedProductsCache() {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redis.set("featured_products", JSON.stringify(featuredProducts));
  } catch (error) {
    console.log("error in update cache function", error.message);
  }
}

export const getProductById = async (req, res) => {
  try {
      const product = await Product.findById(req.params.productId);
      if (!product) {
          return res.status(404).json({ message: 'Product not found' });
      }
      res.json(product);
  } catch (error) {
      res.status(500).json({ message: 'Error fetching product details' });
  }
}

export const searchProducts = async (req, res) => {
  try {
    const { q, sort } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: "Search query is required" });
    }

    console.log("Search query:", q);
    const searchRegex = new RegExp(q, 'i');
    console.log("Search regex:", searchRegex);

    let query = Product.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex }
      ]
    });

    // Apply sorting based on the sort parameter
    switch (sort) {
      case 'featured':
        query = query.sort({ isFeatured: -1, name: 1 });
        break;
      case 'price-asc':
        query = query.sort({ price: 1 });
        break;
      case 'price-desc':
        query = query.sort({ price: -1 });
        break;
      default:
        query = query.sort({ createdAt: -1 }); // Default sort by newest
    }

    const products = await query;
    console.log("Found products:", products.length);

    return res.status(200).json(products);
  } catch (error) {
    console.error("Detailed search error:", {
      message: error.message,
      stack: error.stack,
      query: req.query
    });
    return res.status(500).json({ 
      message: "Error searching products",
      error: error.message 
    });
  }
};

export const updateProductSizes = async (req, res) => {
  try {
    const { productId } = req.params;
    const { sizes, hasSizes } = req.body;

    // Validate input
    if (hasSizes && (!sizes || !Array.isArray(sizes) || sizes.length === 0)) {
      return res.status(400).json({ message: "Sizes are required for products with sizes" });
    }

    // Find the product
    const product = await Product.findById(productId);
    console.log(product);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update the product's size information
    product.hasSizes = hasSizes;
    product.sizes = hasSizes ? sizes : [];

    // Save the updated product
    const updatedProduct = await product.save();

    return res.status(200).json(updatedProduct);
  } catch (error) {
    console.log("Error in updateProductSizes controller", error.message);
    return res.status(500).json({ message: error.message });
  }
};