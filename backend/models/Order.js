import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  products: [
    {
      productModel: {
        type: String,
        enum: ["Product", "Hookah"],
        default: "Product",
      },
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products.productModel",
        required: true,
      },
      quantity: {
        type: String,
        default: 1,
        required: true,
      },
      name: String,
      image: String,
      company: String,
      category: String,
      size: String,
      sellingPrice: Number,
      oldPrice: Number,
    },
  ],
  address: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address",
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ["COD", "Stripe", "Online"],
    default: "COD",
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed"]
  }
});