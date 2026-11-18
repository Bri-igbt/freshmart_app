import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { createCheckoutSession, verifyPayment } from '../controllers/paymentController.js';

const paymentRouter = express.Router();

paymentRouter.post("/create-session", authMiddleware, createCheckoutSession);
paymentRouter.post("/verify-payment", authMiddleware, verifyPayment);

export default paymentRouter