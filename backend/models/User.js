import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [
        /^(\+234|0)[789][01]\d{8}$/,
        "Please provide a valid phone number",
      ],
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
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
