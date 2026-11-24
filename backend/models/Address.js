import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
      match: [
        /^(\+234|0)[789][01]\d{8}$/,
        "Please provide a valid phone number",
      ],
    },
    pinCode: {
      type: String,
      trim: true,
      match: [/^\d{6}$/, "Postal code must be 6 digits"],
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    landmark: {
      type: String,
      trim: true,
    },
    addressType: {
      type: String,
      enum: ["Home", "Office", "Other"],
      default: "Home",
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const Address = mongoose.model("Address", addressSchema);

export default Address;
