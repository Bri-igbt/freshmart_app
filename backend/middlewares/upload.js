import multer from "multer";
import os from "os";
import crypto from "crypto";

const MAX_FILE_SIZE = 5 * 1024 * 1024; 
const EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) =>
    cb(null, `${crypto.randomUUID()}${EXTENSIONS[file.mimetype]}`),
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (EXTENSIONS[file.mimetype]) return cb(null, true);
    cb(new Error("Only JPG, PNG or WebP images are allowed"));
  },
});

export const uploadSingleImage = (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (!error) return next();

    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Image must be 5MB or smaller"
        : error.message;
    res.status(400).json({ success: false, message });
  });
};

export default upload;
