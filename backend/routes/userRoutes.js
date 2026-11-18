import express from "express";
import rateLimit from "express-rate-limit";
import {
  registerUser,
  verifyEmail,
  resendOtp,
  loginUser,
  forgotPassword,
  resetPassword,
  getProfile,
} from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const userRouter = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

userRouter.post("/register", authLimiter, registerUser);
userRouter.post("/verify-email", authLimiter, verifyEmail);
userRouter.post("/resend-otp", authLimiter, resendOtp);
userRouter.post("/login", authLimiter, loginUser);
userRouter.post("/forgot-password", authLimiter, forgotPassword);
userRouter.post("/reset-password", authLimiter, resetPassword);
userRouter.get("/profile", authMiddleware, getProfile);

export default userRouter;
