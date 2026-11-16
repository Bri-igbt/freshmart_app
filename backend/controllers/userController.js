import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import generateOTP from "../utils/generateOTP.js";
import { sendVerificationOTP, sendResetOTP } from "../utils/sendEmail.js";

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 8;

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    console.log(error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email or phone number already in use",
      });
    }

    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");
      return res.status(400).json({ success: false, message });
    }

    res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "Something went wrong"
          : error.message,
    });
  }
};

const normalizeEmail = (email) => String(email).toLowerCase().trim();

// TO REGISTER USER
export const registerUser = handle(async (req, res) => {
  const { name, phone, password } = req.body;
  if (!name || !req.body.email || !phone || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    });
  }

  const email = normalizeEmail(req.body.email);

  const existingUser = await User.findOne({
    $or: [{ email }, { phone: String(phone).trim() }],
  });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "User already exists",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = generateOTP();
  const hashedOtp = await bcrypt.hash(otp, 10);

  const user = await User.create({
    name,
    email,
    phone,
    password: hashedPassword,
    isVerified: false,
    verifyOtp: hashedOtp,
    verifyOtpExpire: new Date(Date.now() + OTP_EXPIRY_MS),
  });

  await sendVerificationOTP(user.email, user.name, otp);
  res.status(201).json({
    success: true,
    message: "Verification OTP sent successfully",
    email: user.email,
  });
});

// TO VERIFY EMAIL
export const verifyEmail = handle(async (req, res) => {
  const { otp } = req.body;
  if (!req.body.email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required",
    });
  }

  const email = normalizeEmail(req.body.email);

  const user = await User.findOne({ email }).select(
    "+verifyOtp +verifyOtpExpire"
  );
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (user.isVerified) {
    return res.status(400).json({
      success: false,
      message: "Email already verified",
    });
  }

  if (
    !user.verifyOtp ||
    !user.verifyOtpExpire ||
    user.verifyOtpExpire < Date.now()
  ) {
    return res.status(400).json({
      success: false,
      message: "OTP expired. Please request a new OTP",
    });
  }

  const isOtpValid = await bcrypt.compare(String(otp), user.verifyOtp);
  if (!isOtpValid) {
    return res.status(400).json({
      success: false,
      message: "Invalid OTP",
    });
  }

  user.isVerified = true;
  user.verifyOtp = null;
  user.verifyOtpExpire = null;
  await user.save();
  res.status(200).json({
    success: true,
    message: "Email verified successfully",
  });
});

// TO RESEND OTP
export const resendOtp = handle(async (req, res) => {
  if (!req.body.email)
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });

  const email = normalizeEmail(req.body.email);

  const user = await User.findOne({ email });
  if (!user)
    return res.status(404).json({
      success: false,
      message: "User not found",
    });

  if (user.isVerified)
    return res.status(400).json({
      success: false,
      message: "Email already verified",
    });

  const otp = generateOTP();
  user.verifyOtp = await bcrypt.hash(otp, 10);
  user.verifyOtpExpire = new Date(Date.now() + OTP_EXPIRY_MS);
  await user.save();
  await sendVerificationOTP(user.email, user.name, otp);
  res.status(200).json({
    success: true,
    message: "OTP sent successfully",
  });
});

// TO LOGIN USER
export const loginUser = handle(async (req, res) => {
  const { password } = req.body;
  if (!req.body.email || !password)
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });

  const email = normalizeEmail(req.body.email);

  const user = await User.findOne({ email }).select("+password");
  if (!user)
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch)
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });

  if (!user.isVerified)
    return res.status(403).json({
      success: false,
      message: "Please verify your email first.",
    });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  });
});

// FORGOT PASSWORD
export const forgotPassword = handle(async (req, res) => {
  if (!req.body.email)
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });

  const email = normalizeEmail(req.body.email);

  const user = await User.findOne({ email });

  if (user) {
    const otp = generateOTP();
    user.resetOtp = await bcrypt.hash(otp, 10);
    user.resetOtpExpire = new Date(Date.now() + OTP_EXPIRY_MS);
    await user.save();
    await sendResetOTP(user.email, user.name, otp);
  }

  res.status(200).json({
    success: true,
    message: "If that email is registered, a reset OTP has been sent.",
  });
});

// TO RESET PASSWORD
export const resetPassword = handle(async (req, res) => {
  const { otp, password } = req.body;
  if (!req.body.email || !otp || !password)
    return res.status(400).json({
      success: false,
      message: "Email, OTP and password are required",
    });

  if (password.length < MIN_PASSWORD_LENGTH)
    return res.status(400).json({
      success: false,
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    });

  const email = normalizeEmail(req.body.email);

  const user = await User.findOne({ email }).select(
    "+resetOtp +resetOtpExpire"
  );
  if (!user)
    return res.status(400).json({
      success: false,
      message: "Invalid OTP or email",
    });

  if (
    !user.resetOtp ||
    !user.resetOtpExpire ||
    user.resetOtpExpire < Date.now()
  )
    return res.status(400).json({
      success: false,
      message: "OTP expired. Please request a new OTP.",
    });

  const isOtpValid = await bcrypt.compare(String(otp), user.resetOtp);
  if (!isOtpValid)
    return res.status(400).json({
      success: false,
      message: "Invalid OTP or email",
    });

  user.password = await bcrypt.hash(password, 10);
  user.resetOtp = null;
  user.resetOtpExpire = null;
  await user.save();
  res.status(200).json({
    success: true,
    message: "Password reset successful.",
  });
});

// TO GET PROFILE
export const getProfile = handle(async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});
