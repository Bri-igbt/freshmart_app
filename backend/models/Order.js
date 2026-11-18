import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
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
          refPath: "products.productModel",
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
          required: true,
          min: [1, "Quantity must be at least 1"],
          validate: {
            validator: Number.isInteger,
            message: "Quantity must be a whole number",
          },
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
    deliveryAddress: {
      fullName: String,
      mobileNumber: String,
      pinCode: String,
      city: String,
      landmark: String,
      addressType: String,
      address: String,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"],
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "Stripe", "Online"],
      default: "COD",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    orderStatus: {
      type: String,
      enum: ["Processing", "On the way", "Delivered", "Cancelled"],
      default: "Processing",
    },
    stripeSessionId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
