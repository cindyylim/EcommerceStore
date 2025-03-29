import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        size: {
          type: String,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    stripeSessionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Add a pre-save hook to check for existing session ID
orderSchema.pre('save', async function(next) {
  if (this.stripeSessionId) {
    const existingOrder = await this.constructor.findOne({ stripeSessionId: this.stripeSessionId });
    if (existingOrder && existingOrder._id.toString() !== this._id.toString()) {
      next(new Error('Order with this Stripe session ID already exists'));
    }
  }
  next();
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
