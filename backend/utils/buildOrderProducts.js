import mongoose from "mongoose";
import "../models/Product.js"; 
import "../models/Hookah.js"; 
import { getDeliveryFee } from "./pricing.js";

const ALLOWED_PRODUCT_MODELS = ["Product", "Hookah"];
const MAX_ITEMS = 50;
const MAX_QUANTITY = 100;

const UNAVAILABLE = "One or more products are no longer available";

const round2 = (value) => Math.round(value * 100) / 100;

const buildOrderProducts = async (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Your cart is empty" };
  }
  if (items.length > MAX_ITEMS) {
    return { error: `You can order at most ${MAX_ITEMS} items at once` };
  }

  const lines = [];
  for (const item of items) {
    const productModel = item?.productModel ?? "Product";
    const quantity = Number(item?.quantity ?? 1);

    if (
      !ALLOWED_PRODUCT_MODELS.includes(productModel) ||
      !mongoose.isObjectIdOrHexString(item?.product) ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_QUANTITY
    ) {
      return { error: "Invalid product in order" };
    }

    lines.push({ productModel, product: String(item.product), quantity });
  }

  const found = new Map();
  for (const modelName of ALLOWED_PRODUCT_MODELS) {
    const ids = lines
      .filter((line) => line.productModel === modelName)
      .map((line) => line.product);
    if (ids.length === 0) continue;

    const docs = await mongoose.models[modelName].find({ _id: { $in: ids } });
    for (const doc of docs) found.set(`${modelName}:${doc._id}`, doc);
  }

  let subtotal = 0;
  const orderProducts = [];

  for (const line of lines) {
    const doc = found.get(`${line.productModel}:${line.product}`);
    if (!doc || !Number.isFinite(doc.sellingPrice)) {
      return { error: UNAVAILABLE };
    }

    subtotal += doc.sellingPrice * line.quantity;
    orderProducts.push({
      productModel: line.productModel,
      product: doc._id,
      quantity: line.quantity,
      name: doc.name,
      image: typeof doc.image === "string" ? doc.image : doc.image?.url,
      company: doc.company,
      category: doc.category,
      size: doc.size,
      sellingPrice: doc.sellingPrice,
      oldPrice: doc.oldPrice,
    });
  }

  subtotal = round2(subtotal);
  const deliveryFee = getDeliveryFee();
  const totalAmount = round2(subtotal + deliveryFee);

  return { orderProducts, subtotal, deliveryFee, totalAmount };
};

export default buildOrderProducts;
