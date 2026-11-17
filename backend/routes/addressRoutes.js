import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { addAddress, deleteAddress, getAddress, updateAddress } from '../controllers/addressController.js';

const addressRouter = express.Router();

addressRouter.post("/add", authMiddleware, addAddress);
addressRouter.get("/", authMiddleware, getAddress);
addressRouter.put("/:id", authMiddleware, updateAddress);
addressRouter.delete("/:id", authMiddleware, deleteAddress);

export default addressRouter;