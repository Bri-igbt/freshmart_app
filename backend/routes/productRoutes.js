import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";
import {
  addProduct,
  deleteProduct,
  getProduct,
  getProducts,
  updateProduct,
} from "../controllers/productController.js";

const productRouter = express.Router();

productRouter.get("/", getProducts);
productRouter.get("/:id", getProduct);
productRouter.post("/add", authMiddleware, adminMiddleware, addProduct);
productRouter.put("/:id", authMiddleware, adminMiddleware, updateProduct);
productRouter.delete("/:id", authMiddleware, adminMiddleware, deleteProduct);

export default productRouter;
