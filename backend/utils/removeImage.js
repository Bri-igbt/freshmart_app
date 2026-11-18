import cloudinary from "../config/cloudinary.js";

const removeImage = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (error) {
    console.log("Image cleanup failed:", error.message);
  }
};

export default removeImage;
