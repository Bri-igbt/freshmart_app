import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import generateOTP from "../utils/generateOTP.js";
import { sendVerificationOTP, sendResetOTP } from "../utils/sendEmail.js";

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_BYTES = 72; // bcrypt ignores anything past 72 bytes

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

const isString = (value) => typeof value === "string";

const normalizeEmail = (email) => String(email).toLowerCase().trim();

const normalizePhone = (phone) =>
  String(phone)
    .replace(/[\s-]/g, "")
    .replace(/^(\+234|234)/, "0");

const getPasswordError = (password) => {
  if (!isString(password) || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) {
    return "Password is too long";
  }
  return null;
};

const onCooldown = (expiresAt) =>
  Boolean(expiresAt) &&
  expiresAt.getTime() - OTP_EXPIRY_MS + RESEND_COOLDOWN_MS > Date.now();

// TO REGISTER USER
export const registerUser = handle(async (req, res) => {
  const { name, email: rawEmail, phone: rawPhone, password } = req.body;
  if (!name || !rawEmail || !rawPhone || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  if (!isString(name) || !isString(rawEmail)) {
    return res.status(400).json({
      success: false,
      message: "Invalid name or email",
    });
  }

  const passwordError = getPasswordError(password);
  if (passwordError) {
    return res.status(400).json({
      success: false,
      message: passwordError,
    });
  }

  const email = normalizeEmail(rawEmail);
  const phone = normalizePhone(rawPhone);

  const matches = await User.find({ $or: [{ email }, { phone }] }).select(
    "+verifyOtpExpire"
  );
  const emailUser = matches.find((u) => u.email === email);
  const phoneUser = matches.find((u) => u.phone === phone);

  // Phone belongs to a different account
  if (phoneUser && (!emailUser || !phoneUser._id.equals(emailUser._id))) {
    return res.status(400).json({
      success: false,
      message: "This phone number is already used by another account",
    });
  }

  // Email belongs to a verified account
  if (emailUser && emailUser.isVerified) {
    return res.status(400).json({
      success: false,
      message: "An account with this email already exists. Please log in.",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = generateOTP();
  const hashedOtp = await bcrypt.hash(otp, 10);

  // Email belongs to an unverified account: refresh it and resend the OTP
  if (emailUser) {
    if (onCooldown(emailUser.verifyOtpExpire)) {
      return res.status(200).json({
        success: true,
        message: "A verification code was just sent. Check your email.",
        email: emailUser.email,
      });
    }

    emailUser.name = name;
    emailUser.phone = phone;
    emailUser.password = hashedPassword;
    emailUser.verifyOtp = hashedOtp;
    emailUser.verifyOtpExpire = new Date(Date.now() + OTP_EXPIRY_MS);
    emailUser.verifyOtpAttempts = 0;
    await emailUser.save();

    await sendVerificationOTP(emailUser.email, emailUser.name, otp);
    return res.status(200).json({
      success: true,
      message: "Verification OTP sent successfully",
      email: emailUser.email,
    });
  }

  // Brand new user
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
  const { email: rawEmail, otp } = req.body;
  if (!rawEmail || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required",
    });
  }

  const email = normalizeEmail(rawEmail);

  const user = await User.findOneAndUpdate(
    { email },
    { $inc: { verifyOtpAttempts: 1 } },
    { new: true }
  ).select("+verifyOtp +verifyOtpExpire +verifyOtpAttempts");
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

  if (user.verifyOtpAttempts > MAX_OTP_ATTEMPTS) {
    return res.status(429).json({
      success: false,
      message: "Too many attempts. Please request a new OTP",
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
  user.verifyOtpAttempts = 0;
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

  const user = await User.findOne({ email }).select("+verifyOtpExpire");
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

  if (onCooldown(user.verifyOtpExpire))
    return res.status(429).json({
      success: false,
      message: "Please wait a minute before requesting another OTP",
    });

  const otp = generateOTP();
  user.verifyOtp = await bcrypt.hash(otp, 10);
  user.verifyOtpExpire = new Date(Date.now() + OTP_EXPIRY_MS);
  user.verifyOtpAttempts = 0;
  await user.save();
  await sendVerificationOTP(user.email, user.name, otp);
  res.status(200).json({
    success: true,
    message: "OTP sent successfully",
  });
});

// TO LOGIN USER
export const loginUser = handle(async (req, res) => {
  const { email: rawEmail, password } = req.body;
  if (!isString(rawEmail) || !isString(password) || !rawEmail || !password)
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });

  const email = normalizeEmail(rawEmail);

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

  const user = await User.findOne({ email }).select("+resetOtpExpire");

  if (user && !onCooldown(user.resetOtpExpire)) {
    const otp = generateOTP();
    user.resetOtp = await bcrypt.hash(otp, 10);
    user.resetOtpExpire = new Date(Date.now() + OTP_EXPIRY_MS);
    user.resetOtpAttempts = 0;
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
  const { email: rawEmail, otp, password } = req.body;
  if (!rawEmail || !otp || !password)
    return res.status(400).json({
      success: false,
      message: "Email, OTP and password are required",
    });

  const passwordError = getPasswordError(password);
  if (passwordError)
    return res.status(400).json({
      success: false,
      message: passwordError,
    });

  const email = normalizeEmail(rawEmail);

  const user = await User.findOneAndUpdate(
    { email },
    { $inc: { resetOtpAttempts: 1 } },
    { new: true }
  ).select("+resetOtp +resetOtpExpire +resetOtpAttempts");
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

  if (user.resetOtpAttempts > MAX_OTP_ATTEMPTS)
    return res.status(429).json({
      success: false,
      message: "Too many attempts. Please request a new OTP.",
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
  user.resetOtpAttempts = 0;
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
