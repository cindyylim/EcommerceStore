import mongoose from "mongoose";

const sizeSchema = new mongoose.Schema({
  size: {
    type: String,
    required: true,
    enum: ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"],
  },
  inStock: {
    type: Boolean,
    default: true,
  },
  reserved: {
    type: Number,
    default: 0,
    min: 0,
  },
  quantity: {
    type: Number,
    default: 0,
    min: 0,
  },
  reservations: [
    {
      cartSessionId: { type: String },
      quantity: { type: Number, min: 0 },
      reservedAt: { type: Date },
    },
  ],
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String,
      required: [true, "Image is required"],
    },
    category: {
      type: String,
      required: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    sizes: [sizeSchema],
    hasSizes: {
      type: Boolean,
      default: false,
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    reserved: {
      type: Number,
      default: 0,
      min: 0,
    },
    reservations: [
      {
        cartSessionId: { type: String },
        quantity: { type: Number, min: 0 },
        reservedAt: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

// Pre-save hook to update inStock status based on quantity
productSchema.pre("save", function (next) {
  if (this.hasSizes) {
    // For products with sizes, check if any size has quantity > 0
    this.inStock = this.sizes.some((size) => size.quantity > 0);
  } else {
    // For products without sizes, check the main quantity
    this.inStock = this.quantity > 0;
  }
  next();
});

const Product = mongoose.model("Product", productSchema);

export default Product;
