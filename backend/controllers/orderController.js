import mongoose from "mongoose";
import Address from "../models/Address.js";
import Order from "../models/Order.js";
import buildOrderProducts from "../utils/buildOrderProducts.js";

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    console.log(error);

    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");
      return res.status(400).json({ success: false, message });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid input",
      });
    }

    res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "Something went wrong"
          : error.message,
    });
  }
};

const notFound = (res) =>
  res.status(404).json({
    success: false,
    message: "Order Not Found",
  });

// TO PLACE AN ORDER (cash on delivery)
export const placeOrder = handle(async (req, res) => {
  const { address: addressId, products, paymentMethod } = req.body;

  if (["Online", "Stripe"].includes(paymentMethod)) {
    return res.status(400).json({
      success: false,
      message: "Online orders are created only after successful payment",
    });
  }

  if (!mongoose.isObjectIdOrHexString(addressId)) {
    return res.status(400).json({
      success: false,
      message: "Please add a delivery address first",
    });
  }

  const address = await Address.findOne({
    _id: addressId,
    user: req.user._id,
  });
  if (!address) {
    return res.status(400).json({
      success: false,
      message: "Please add a delivery address first",
    });
  }

  const { error, orderProducts, totalAmount } = await buildOrderProducts(
    products
  );
  if (error) {
    return res.status(400).json({ success: false, message: error });
  }

  const order = await Order.create({
    user: req.user._id,
    products: orderProducts,
    address: address._id,
    deliveryAddress: {
      fullName: address.fullName,
      mobileNumber: address.mobileNumber,
      pinCode: address.pinCode,
      city: address.city,
      landmark: address.landmark,
      addressType: address.addressType,
      address: address.address,
    },
    totalAmount,
    paymentMethod: "COD",
    paymentStatus: "Pending",
    orderStatus: "Processing",
  });

  res.status(201).json({
    success: true,
    message: "Order placed successfully",
    order,
  });
});

// TO GET A PARTICULAR ORDER BY ID (owner or admin)
export const getOrder = handle(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return notFound(res);

  const order = await Order.findById(req.params.id)
    .populate("products.product")
    .populate("address")
    .populate("user", "name email phone");
  if (!order) return notFound(res);

  const isOwner = order.user?._id?.equals(req.user._id);
  if (!isOwner && req.user.role !== "admin") return notFound(res);

  res.status(200).json({
    success: true,
    order,
  });
});

// TO GET THE LOGGED-IN USER'S ORDERS
export const getMyOrders = handle(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate("products.product")
    .populate("address")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: orders.length,
    orders,
  });
});

// TO GET ALL ORDERS (admin)
export const getAllOrders = handle(async (req, res) => {
  const orders = await Order.find()
    .populate("address")
    .populate("user", "name email phone")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: orders.length,
    orders,
  });
});

// TO CANCEL YOUR OWN ORDER 
export const cancelOrder = handle(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return notFound(res);

  const order = await Order.findOneAndUpdate(
    {
      _id: req.params.id,
      user: req.user._id,
      orderStatus: "Processing",
      paymentStatus: { $ne: "Paid" },
    },
    { $set: { orderStatus: "Cancelled" } },
    { new: true }
  );

  if (!order) {
    return res.status(400).json({
      success: false,
      message: "Order not found or can no longer be cancelled",
    });
  }

  res.status(200).json({
    success: true,
    message: "Order cancelled successfully",
    order,
  });
});

// TO UPDATE AN ORDER'S STATUS (admin)
export const updateOrder = handle(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return notFound(res);

  const { orderStatus, paymentStatus } = req.body;
  const update = {};

  if (orderStatus !== undefined) {
    if (typeof orderStatus !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }
    update.orderStatus = orderStatus;
  }

  if (paymentStatus !== undefined) {
    if (typeof paymentStatus !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }
    update.paymentStatus = paymentStatus;
  }

  if (Object.keys(update).length === 0) {
    return res.status(400).json({
      success: false,
      message: "Provide orderStatus or paymentStatus to update",
    });
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { $set: update },
    { new: true, runValidators: true }
  );
  if (!order) return notFound(res);

  res.status(200).json({
    success: true,
    message: "Order Updated Successfully",
    order,
  });
});

// TO DELETE AN ORDER (admin)
export const deleteOrder = handle(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return notFound(res);

  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) return notFound(res);

  res.status(200).json({
    success: true,
    message: "Order Deleted Successfully",
    order,
  });
});
