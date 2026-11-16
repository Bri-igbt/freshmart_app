import express from express;
import {
  registerUser,
  verifyEmail,
  resendOtp,
  loginUser,
  forgotPassword,
  resetPassword,
  getProfile
} from '../controllers/userController.js'
import { authMiddleware } from '../middlewares/authMiddleware.js';

const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/verify-email', verifyEmail);
userRouter.post('/resend-otp', resendOtp);
userRouter.post('/login', loginUser);
userRouter.post('/forgot-Password', forgotPassword);
userRouter.post('/reset-password', resetPassword);
userRouter.get('/profile', authMiddleware, getProfile);

export default userRouter