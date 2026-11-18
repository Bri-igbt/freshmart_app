import mongoose from "mongoose";
import Address from "../models/Address.js";
import handle from "../utils/handle.js";

const FIELDS = [
  "fullName",
  "mobileNumber",
  "pinCode",
  "city",
  "landmark",
  "addressType",
  "address",
];

const pickFields = (body = {}) =>
  Object.fromEntries(
    FIELDS.filter((field) => body[field] !== undefined).map((field) => [
      field,
      body[field],
    ])
  );

const notFound = (res) =>
  res.status(404).json({
    success: false,
    message: "Address Not Found",
  });

// TO ADD AN ADDRESS
export const addAddress = handle(async (req, res) => {
  const address = await Address.create({
    ...pickFields(req.body),
    user: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: "Address Added Successfully",
    address,
  });
});

// TO GET ADDRESSES
export const getAddress = handle(async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    success: true,
    count: addresses.length,
    addresses,
  });
});

// TO UPDATE AN ADDRESS
export const updateAddress = handle(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return notFound(res);

  const address = await Address.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: pickFields(req.body) },
    { new: true, runValidators: true }
  );
  if (!address) return notFound(res);

  res.status(200).json({
    success: true,
    message: "Address Updated Successfully",
    address,
  });
});

// TO DELETE AN ADDRESS
export const deleteAddress = handle(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return notFound(res);

  const address = await Address.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!address) return notFound(res);

  res.status(200).json({
    success: true,
    message: "Address Deleted Successfully",
    address,
  });
});
