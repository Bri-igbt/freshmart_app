import mongoose from "mongoose";

const hookahSchema = new mongoose.Schema(
  {
    image: {
      url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: [0, "Selling price cannot be negative"],
    },
    oldPrice: {
      type: Number,
      required: true,
      min: [0, "Old price cannot be negative"],
    },
    size: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

hookahSchema.pre("validate", function () {
  if (this.oldPrice < this.sellingPrice) {
    this.invalidate("oldPrice", "Old price cannot be lower than selling price");
  }
});

const Hookah = mongoose.model("Hookah", hookahSchema);

export default Hookah;
