import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
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
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
  },
  { timestamps: true }
);


productSchema.pre("validate", function () {
  if (this.oldPrice < this.sellingPrice) {
    this.invalidate("oldPrice", "Old price cannot be lower than selling price");
  }
});

const Product = mongoose.model("Product", productSchema);

export default Product;
