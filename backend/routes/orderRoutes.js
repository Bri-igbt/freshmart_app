import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";
import {
  cancelOrder,
  deleteOrder,
  getAllOrders,
  getMyOrders,
  getOrder,
  placeOrder,
  updateOrder,
} from "../controllers/orderController.js";

const orderRouter = express.Router();

orderRouter.post("/place", authMiddleware, placeOrder);
orderRouter.get("/my-orders", authMiddleware, getMyOrders);
orderRouter.get("/", authMiddleware, adminMiddleware, getAllOrders);
orderRouter.get("/:id", authMiddleware, getOrder);
orderRouter.put("/:id/cancel", authMiddleware, cancelOrder);
orderRouter.put("/:id", authMiddleware, adminMiddleware, updateOrder);
orderRouter.delete("/:id", authMiddleware, adminMiddleware, deleteOrder);

export default orderRouter;
