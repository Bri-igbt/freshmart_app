import mongoose from "mongoose";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import handle from "../utils/handle.js";
import removeImage from "../utils/removeImage.js";
import { hasValidImage, isNonEmptyString } from "../utils/validators.js";

const notFound = (res) =>
  res.status(404).json({
    success: false,
    message: "Category Not Found",
  });

// TO ADD A CATEGORY
export const addCategory = handle(async (req, res) => {
  const { categoryName, image } = req.body;

  if (!isNonEmptyString(categoryName)) {
    return res.status(400).json({
      success: false,
      message: "Category Name Required",
    });
  }

  if (!hasValidImage(image)) {
    return res.status(400).json({
      success: false,
      message: "Image Object Missing",
    });
  }

  const name = categoryName.trim();
  if (await Category.exists({ categoryName: name })) {
    return res.status(400).json({
      success: false,
      message: "Category Already Exists",
    });
  }

  const category = await Category.create({
    categoryName: name,
    image: { url: image.url, public_id: image.public_id },
  });

  res.status(201).json({
    success: true,
    message: "Category Added Successfully",
    category,
  });
});

// TO GET CATEGORIES
export const getCategories = handle(async (req, res) => {
  const categories = await Category.find();

  res.status(200).json({
    success: true,
    count: categories.length,
    categories,
  });
});

// TO GET A CATEGORY
export const getCategory = handle(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return notFound(res);

  const category = await Category.findById(req.params.id);
  if (!category) return notFound(res);

  res.status(200).json({
    success: true,
    category,
  });
});

// TO UPDATE A CATEGORY
export const updateCategory = handle(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return notFound(res);

  const category = await Category.findById(req.params.id);
  if (!category) return notFound(res);

  const { categoryName, image } = req.body;
  if (categoryName !== undefined && !isNonEmptyString(categoryName)) {
    return res.status(400).json({
      success: false,
      message: "Category Name Required",
    });
  }

  const prevName = category.categoryName;
  let oldImagePublicId = null;

  if (categoryName !== undefined) category.categoryName = categoryName.trim();

  if (hasValidImage(image) && image.public_id !== category.image.public_id) {
    oldImagePublicId = category.image.public_id;
    category.image = { url: image.url, public_id: image.public_id };
  }

  await category.save();

  if (category.categoryName !== prevName) {
    await Product.updateMany(
      { category: prevName },
      { $set: { category: category.categoryName } }
    );
  }

  await removeImage(oldImagePublicId);

  res.status(200).json({
    success: true,
    message: "Category Updated Successfully",
    category,
  });
});

// TO DELETE A CATEGORY
export const deleteCategory = handle(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return notFound(res);

  const category = await Category.findById(req.params.id);
  if (!category) return notFound(res);

  if (await Product.exists({ category: category.categoryName })) {
    return res.status(400).json({
      success: false,
      message: "Move or delete this category's products first",
    });
  }

  await Category.findByIdAndDelete(req.params.id);
  await removeImage(category.image?.public_id);

  res.status(200).json({
    success: true,
    message: "Category Deleted Successfully",
  });
});
