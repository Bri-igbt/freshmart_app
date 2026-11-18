import mongoose from "mongoose";
import stripe from "../config/stripe.js";
import Order from "../models/Order.js";
import Address from "../models/Address.js";
import buildOrderProducts from "../utils/buildOrderProducts.js";
import handle from "../utils/handle.js";

const CART_CHUNK_SIZE = 450;

const packCart = (orderProducts) => {
  const compact = orderProducts
    .map(
      (item) =>
        `${item.productModel === "Hookah" ? "H" : "P"}:${item.product}:${
          item.quantity
        }`
    )
    .join(",");

  const metadata = {};
  for (let i = 0; i * CART_CHUNK_SIZE < compact.length; i++) {
    metadata[`cart_${i}`] = compact.slice(
      i * CART_CHUNK_SIZE,
      (i + 1) * CART_CHUNK_SIZE
    );
  }
  return metadata;
};

const unpackCart = (metadata = {}) => {
  let compact = "";
  for (let i = 0; metadata[`cart_${i}`] !== undefined; i++) {
    compact += metadata[`cart_${i}`];
  }

  return compact
    .split(",")
    .filter(Boolean)
    .map((part) => {
      const [model, product, quantity] = part.split(":");
      return {
        productModel: model === "H" ? "Hookah" : "Product",
        product,
        quantity: Number(quantity),
      };
    });
};

// TO CREATE A CHECKOUT SESSION
export const createCheckoutSession = handle(async (req, res) => {
  const { order } = req.body;
  if (!order || !mongoose.isObjectIdOrHexString(order.address)) {
    return res.status(400).json({
      success: false,
      message: "Invalid checkout details",
    });
  }

  const address = await Address.findOne({
    _id: order.address,
    user: req.user._id,
  });
  if (!address) {
    return res.status(400).json({
      success: false,
      message: "Please add a delivery address first",
    });
  }

  const { error, orderProducts, deliveryFee } = await buildOrderProducts(
    order.products
  );
  if (error) {
    return res.status(400).json({ success: false, message: error });
  }

  const lineItems = orderProducts.map((item) => ({
    price_data: {
      currency: "ngn",
      product_data: {
        name: item.name || "FreshMart Item",
        images: item.image ? [item.image] : [],
      },
      unit_amount: Math.round(item.sellingPrice * 100),
    },
    quantity: item.quantity,
  }));

  if (deliveryFee > 0) {
    lineItems.push({
      price_data: {
        currency: "ngn",
        product_data: { name: "Delivery fee" },
        unit_amount: Math.round(deliveryFee * 100),
      },
      quantity: 1,
    });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
    metadata: {
      userId: req.user._id.toString(),
      address: address._id.toString(),
      ...packCart(orderProducts),
    },
  });

  res.status(200).json({
    success: true,
    url: session.url,
  });
});

// TO VERIFY PAYMENT
export const verifyPayment = handle(async (req, res) => {
  const { sessionId } = req.body;
  if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment session",
    });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") {
    return res.status(400).json({
      success: false,
      message: "Payment Failed",
    });
  }

  if (session.metadata?.userId !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: "Payment session does not belong to this user",
    });
  }

  const existingOrder = await Order.findOne({ stripeSessionId: session.id });
  if (existingOrder) {
    return res.status(200).json({
      success: true,
      message: "Payment Already Verified",
      order: existingOrder,
    });
  }

  const address = await Address.findOne({
    _id: session.metadata.address,
    user: req.user._id,
  });
  if (!address) {
    return res.status(400).json({
      success: false,
      message:
        "Your payment was received, but the delivery address no longer exists. Please contact support.",
    });
  }

  const { error, orderProducts } = await buildOrderProducts(
    unpackCart(session.metadata)
  );
  if (error) {
    return res.status(400).json({
      success: false,
      message:
        "Your payment was received, but we couldn't create the order. Please contact support.",
    });
  }

  let order;
  try {
    order = await Order.create({
      user: req.user._id,
      products: orderProducts,
      address: address._id,
      deliveryAddress: {
        fullName: address.fullName,
        mobileNumber: address.mobileNumber,
        pinCode: address.pinCode,
        city: address.city,
        landmark: address.landmark,
        addressType: address.addressType,
        address: address.address,
      },
      totalAmount: session.amount_total / 100,
      paymentMethod: "Online",
      paymentStatus: "Paid",
      orderStatus: "Processing",
      stripeSessionId: session.id,
    });
  } catch (error) {
    if (error.code === 11000) {
      const duplicate = await Order.findOne({ stripeSessionId: session.id });
      return res.status(200).json({
        success: true,
        message: "Payment Already Verified",
        order: duplicate,
      });
    }
    throw error;
  }

  res.status(200).json({
    success: true,
    message: "Payment Verified Successfully",
    order,
  });
});
