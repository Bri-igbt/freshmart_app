import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // Stored in local format (e.g. 08012345678).
      // The controller converts +234 / 234 numbers before saving.
      match: [/^0[789][01]\d{8}$/, "Please provide a valid phone number"],
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifyOtp: {
      type: String,
      default: null,
      select: false,
    },
    verifyOtpExpire: {
      type: Date,
      default: null,
      select: false,
    },
    verifyOtpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    resetOtp: {
      type: String,
      default: null,
      select: false,
    },
    resetOtpExpire: {
      type: Date,
      default: null,
      select: false,
    },
    resetOtpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
