import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";
import {
  addCategory,
  deleteCategory,
  getCategories,
  getCategory,
  updateCategory,
} from "../controllers/categoryController.js";

const categoryRouter = express.Router();

categoryRouter.get("/", getCategories);
categoryRouter.get("/:id", getCategory);
categoryRouter.post("/add", authMiddleware, adminMiddleware, addCategory);
categoryRouter.put("/:id", authMiddleware, adminMiddleware, updateCategory);
categoryRouter.delete("/:id", authMiddleware, adminMiddleware, deleteCategory);

export default categoryRouter;
