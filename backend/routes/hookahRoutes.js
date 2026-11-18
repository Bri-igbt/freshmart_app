import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";
import {
  addHookah,
  deleteHookah,
  getHookahById,
  getHookahs,
  updateHookah,
} from "../controllers/hookahController.js";

const hookahRouter = express.Router();

hookahRouter.get("/", getHookahs);
hookahRouter.get("/:id", getHookahById);
hookahRouter.post("/", authMiddleware, adminMiddleware, addHookah);
hookahRouter.put("/:id", authMiddleware, adminMiddleware, updateHookah);
hookahRouter.delete("/:id", authMiddleware, adminMiddleware, deleteHookah);

export default hookahRouter;
