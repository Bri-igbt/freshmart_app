import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";
import { uploadSingleImage } from "../middlewares/upload.js";
import { uploadImage } from "../controllers/uploadController.js";

const uploadRouter = express.Router();

uploadRouter.post(
  "/",
  authMiddleware,
  adminMiddleware,
  uploadSingleImage,
  uploadImage
);

export default uploadRouter;
