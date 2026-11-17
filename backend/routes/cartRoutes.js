import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { addToCart, getCart, removeCart, updateCart } from '../controllers/cartController.js';

const cartRouter = express.Router();

cartRouter.post("/", authMiddleware, addToCart);
cartRouter.get("/", authMiddleware, getCart);
cartRouter.put("/:id", authMiddleware, updateCart);
cartRouter.delete("/:id", authMiddleware, removeCart);

export default cartRouter;