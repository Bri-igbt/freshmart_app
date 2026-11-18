import Category from "../models/Category.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import handle from "../utils/handle.js";
import { formatOrderItem } from "../utils/formatOrder.js";

const LATEST_ORDERS_LIMIT = 10;

// TO GET DASHBOARD
export const getDashboard = handle(async (req, res) => {
  const [
    revenueResult,
    totalOrders,
    totalProducts,
    totalCategories,
    totalDelivered,
    totalCancelled,
    totalActive,
    latestOrders,
  ] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          $or: [
            { paymentMethod: "COD", orderStatus: "Delivered" },
            {
              paymentMethod: { $in: ["Online", "Stripe"] },
              paymentStatus: "Paid",
              orderStatus: { $ne: "Cancelled" },
            },
          ],
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Order.countDocuments(),
    Product.countDocuments(),
    Category.countDocuments(),
    Order.countDocuments({ orderStatus: "Delivered" }),
    Order.countDocuments({ orderStatus: "Cancelled" }),
    Order.countDocuments({ orderStatus: { $nin: ["Delivered", "Cancelled"] } }),
    Order.find()
      .populate("user", "name phone")
      .populate("address")
      .populate(
        "products.product",
        "name company category size sellingPrice oldPrice image"
      )
      .sort({ createdAt: -1 })
      .limit(LATEST_ORDERS_LIMIT),
  ]);

  const totalRevenue = revenueResult[0]?.total ?? 0;

  const formattedOrders = latestOrders.map((order) => ({
    orderId: order._id,
    customerName: order.user?.name || "",
    phone: order.user?.phone || "",
    totalAmount: order.totalAmount,
    paymentMethod:
      order.paymentMethod === "Stripe" ? "Online" : order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    orderDate: order.createdAt,
    products: order.products.map(formatOrderItem),
  }));

  res.status(200).json({
    success: true,
    dashboard: {
      totalRevenue,
      totalOrders,
      totalProducts,
      totalCategories,
      totalDelivered,
      totalCancelled,
      totalActive,
      latestOrders: formattedOrders,
    },
  });
});
