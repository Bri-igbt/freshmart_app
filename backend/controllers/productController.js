import mongoose from "mongoose";
import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    console.log(error);

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

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim() !== "";

const hasValidImage = (image) =>
  isNonEmptyString(image?.url) && isNonEmptyString(image?.public_id);

const notFound = (res) =>
  res.status(404).json({
    success: false,
    message: "Product Not Found",
  });

const removeImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.log("Product image cleanup failed:", error.message);
  }
};

// TO ADD A PRODUCT
export const addProduct = handle(async (req, res) => {
  const { image, name, company, sellingPrice, oldPrice, size, category } =
    req.body;

  if (!hasValidImage(image)) {
    return res.status(400).json({
      success: false,
      message: "Product image is required",
    });
  }

  const product = await Product.create({
    image: { url: image.url, public_id: image.public_id },
    name,
    company,
    sellingPrice,
    oldPrice,
    size,
    category,
  });

  res.status(201).json({
    success: true,
    message: "Product Added Successfully",
    product,
  });
});

// TO GET ALL PRODUCTS
export const getProducts = handle(async (req, res) => {
  const { category } = req.query;

  if (category !== undefined && typeof category !== "string") {
    return res.status(400).json({
      success: false,
      message: "Invalid category",
    });
  }

  const filter = category ? { category } : {};
  const products = await Product.find(filter).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: products.length,
    products,
  });
});

// TO GET A PRODUCT
export const getProduct = handle(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);

  const product = await Product.findById(req.params.id);
  if (!product) return notFound(res);

  res.status(200).json({
    success: true,
    product,
  });
});

// TO UPDATE A PRODUCT
export const updateProduct = handle(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);

  const product = await Product.findById(req.params.id);
  if (!product) return notFound(res);

  const { image, name, company, sellingPrice, oldPrice, size, category } =
    req.body;

  let oldImagePublicId = null;
  if (hasValidImage(image) && image.public_id !== product.image.public_id) {
    oldImagePublicId = product.image.public_id;
    product.image = {
      url: image.url,
      public_id: image.public_id,
    };
  }

  if (name) product.name = name;
  if (company) product.company = company;
  if (sellingPrice !== undefined) product.sellingPrice = sellingPrice;
  if (oldPrice !== undefined) product.oldPrice = oldPrice;
  if (size) product.size = size;
  if (category) product.category = category;

  await product.save();

  if (oldImagePublicId) await removeImage(oldImagePublicId);

  res.status(200).json({
    success: true,
    message: "Product Updated Successfully",
    product,
  });
});

// TO DELETE A PRODUCT
export const deleteProduct = handle(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);

  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return notFound(res);

  if (product.image?.public_id) await removeImage(product.image.public_id);

  res.status(200).json({
    success: true,
    message: "Product Deleted Successfully",
  });
});
