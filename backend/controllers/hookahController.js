import mongoose from "mongoose";
import Hookah from "../models/Hookah.js";
import handle from "../utils/handle.js";
import removeImage from "../utils/removeImage.js";
import { hasValidImage } from "../utils/validators.js";

const notFound = (res) =>
  res.status(404).json({
    success: false,
    message: "Hookah Not Found",
  });

// TO ADD A HOOKAH
export const addHookah = handle(async (req, res) => {
  const { image, name, company, sellingPrice, oldPrice, size } = req.body;

  if (!hasValidImage(image)) {
    return res.status(400).json({
      success: false,
      message: "Hookah image is required",
    });
  }

  const hookah = await Hookah.create({
    image: { url: image.url, public_id: image.public_id },
    name,
    company,
    sellingPrice,
    oldPrice,
    size,
  });

  res.status(201).json({
    success: true,
    message: "Hookah added Successfully",
    hookah,
  });
});

// TO GET ALL HOOKAHS
export const getHookahs = handle(async (req, res) => {
  const hookahs = await Hookah.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: hookahs.length,
    hookahs,
  });
});

// TO GET A HOOKAH BY ID
export const getHookahById = handle(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return notFound(res);

  const hookah = await Hookah.findById(req.params.id);
  if (!hookah) return notFound(res);

  res.status(200).json({
    success: true,
    hookah,
  });
});

// TO UPDATE A HOOKAH
export const updateHookah = handle(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return notFound(res);

  const hookah = await Hookah.findById(req.params.id);
  if (!hookah) return notFound(res);

  const { image, name, company, sellingPrice, oldPrice, size } = req.body;

  let oldImagePublicId = null;
  if (hasValidImage(image) && image.public_id !== hookah.image?.public_id) {
    oldImagePublicId = hookah.image?.public_id;
    hookah.image = { url: image.url, public_id: image.public_id };
  }

  if (name) hookah.name = name;
  if (company) hookah.company = company;
  if (sellingPrice !== undefined) hookah.sellingPrice = sellingPrice;
  if (oldPrice !== undefined) hookah.oldPrice = oldPrice;
  if (size) hookah.size = size;

  await hookah.save();
  await removeImage(oldImagePublicId);

  res.status(200).json({
    success: true,
    message: "Hookah Updated Successfully",
    hookah,
  });
});

// TO DELETE A HOOKAH
export const deleteHookah = handle(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return notFound(res);

  const hookah = await Hookah.findByIdAndDelete(req.params.id);
  if (!hookah) return notFound(res);

  await removeImage(hookah.image?.public_id);

  res.status(200).json({
    success: true,
    message: "Hookah Deleted Successfully",
  });
});
