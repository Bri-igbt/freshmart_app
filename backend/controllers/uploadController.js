import fs from "fs";
import cloudinary from "../config/cloudinary.js";
import handle from "../utils/handle.js";

// TO UPLOAD AN IMAGE
export const uploadImage = handle(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please select an image",
    });
  }

  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "FreshMart-Images",
      resource_type: "image",
    });

    res.status(200).json({
      success: true,
      message: "Image Uploaded Successfully",
      image: {
        url: result.secure_url,
        public_id: result.public_id,
      },
    });
  } finally {
    await fs.promises.unlink(req.file.path).catch((error) => {
      console.log("Local upload cleanup failed:", error.message);
    });
  }
});
