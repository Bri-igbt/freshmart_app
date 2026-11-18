import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import handle from "../utils/handle.js";

const MAX_QUANTITY = 100;

const parseQuantity = (value, fallback) => {
  const quantity = value === undefined ? fallback : Number(value);
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= MAX_QUANTITY
    ? quantity
    : null;
};

const notFound = (res) =>
  res.status(404).json({
    success: false,
    message: "Cart Item Not Found",
  });

// TO ADD TO A CART
export const addToCart = handle(async (req, res) => {
  const { product, quantity } = req.body;

  if (!mongoose.isObjectIdOrHexString(product)) {
    return res.status(404).json({
      success: false,
      message: "Product Not Found",
    });
  }

  const qty = parseQuantity(quantity, 1);
  if (!qty) {
    return res.status(400).json({
      success: false,
      message: `Quantity must be a whole number from 1 to ${MAX_QUANTITY}`,
    });
  }

  if (!(await Product.exists({ _id: product }))) {
    return res.status(404).json({
      success: false,
      message: "Product Not Found",
    });
  }

  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id, product },
    { $inc: { quantity: qty } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  if (cart.quantity > MAX_QUANTITY) {
    cart.quantity = MAX_QUANTITY;
    await cart.save();
  }

  res.status(200).json({
    success: true,
    message: "Product Added To Cart",
    cart,
  });
});

// TO GET A CART
export const getCart = handle(async (req, res) => {
  const items = await Cart.find({ user: req.user._id }).populate("product");
  const cart = items.filter((item) => item.product);

  res.status(200).json({
    success: true,
    count: cart.length,
    cart,
  });
});

// TO UPDATE A CART ITEM
export const updateCart = handle(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return notFound(res);

  const qty = parseQuantity(req.body.quantity, undefined);
  if (!qty) {
    return res.status(400).json({
      success: false,
      message: `Quantity must be a whole number from 1 to ${MAX_QUANTITY}`,
    });
  }

  const cart = await Cart.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: { quantity: qty } },
    { new: true }
  );
  if (!cart) return notFound(res);

  res.status(200).json({
    success: true,
    message: "Cart Updated Successfully",
    cart,
  });
});

// TO REMOVE A CART ITEM
export const removeCart = handle(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return notFound(res);

  const cart = await Cart.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!cart) return notFound(res);

  res.status(200).json({
    success: true,
    message: "Product Removed From Cart",
  });
});
