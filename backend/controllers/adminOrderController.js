import mongoose from "mongoose";
import Order from "../models/Order.js";
import User from "../models/User.js";
import handle from "../utils/handle.js";
import { formatOrderItem } from "../utils/formatOrder.js";

const ORDER_STATUSES = ["Processing", "On the way", "Delivered", "Cancelled"];
const PRODUCT_FIELDS = "name image company category size sellingPrice oldPrice";

const payLabel = (pm) => (pm === "Stripe" ? "Online" : pm);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const notFound = (res) =>
  res.status(404).json({
    success: false,
    message: "Order Not Found",
  });

const formatOrder = (order) => ({
  orderId: order._id,
  customer: {
    id: order.user?._id,
    name: order.user?.name,
    email: order.user?.email,
    phone: order.user?.phone,
  },
  address: order.deliveryAddress?.fullName
    ? order.deliveryAddress
    : order.address,
  products: order.products.map(formatOrderItem),
  totalAmount: order.totalAmount,
  paymentMethod: payLabel(order.paymentMethod),
  paymentStatus: order.paymentStatus,
  orderStatus: order.orderStatus,
  createdAt: order.createdAt,
});

// TO GET ALL ORDERS
export const getAllOrders = handle(async (req, res) => {
  const { search = "", status = "All", page = 1, limit = 10 } = req.query;

  if (typeof search !== "string" || typeof status !== "string") {
    return res.status(400).json({
      success: false,
      message: "Invalid search or status",
    });
  }

  if (status !== "All" && !ORDER_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Order Status",
    });
  }

  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

  const filter = {};
  if (status !== "All") filter.orderStatus = status;

  if (search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), "i");
    const users = await User.find({
      $or: [{ name: regex }, { email: regex }, { phone: regex }],
    }).select("_id");
    filter.user = { $in: users.map((u) => u._id) };
  }

  const [totalOrders, orders] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter)
      .populate("user", "name email phone")
      .populate("address")
      .populate("products.product", PRODUCT_FIELDS)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize),
  ]);

  res.status(200).json({
    success: true,
    totalOrders,
    currentPage,
    totalPages: Math.ceil(totalOrders / pageSize),
    pageSize,
    orders: orders.map(formatOrder),
  });
});

// TO GET A SINGLE ORDER
export const getSingleOrder = handle(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return notFound(res);

  const order = await Order.findById(req.params.id)
    .populate("user", "name email phone")
    .populate("address")
    .populate("products.product", PRODUCT_FIELDS);
  if (!order) return notFound(res);

  res.status(200).json({
    success: true,
    order: formatOrder(order),
  });
});

// TO UPDATE AN ORDER STATUS
export const updateOrderStatus = handle(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return notFound(res);

  const { orderStatus } = req.body;
  if (!ORDER_STATUSES.includes(orderStatus)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Order Status",
    });
  }

  const order = await Order.findById(req.params.id);
  if (!order) return notFound(res);

  order.orderStatus = orderStatus;
  if (order.paymentMethod === "COD")
    order.paymentStatus = orderStatus === "Delivered" ? "Paid" : "Pending";
  if (["Online", "Stripe"].includes(order.paymentMethod))
    order.paymentStatus = "Paid";

  await order.save();
  res.status(200).json({
    success: true,
    message: "Order Status Updated Successfully",
    order,
  });
});

// TO DELETE AN ORDER
export const deleteOrder = handle(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return notFound(res);

  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) return notFound(res);

  res.status(200).json({
    success: true,
    message: "Order Deleted Successfully",
  });
});
