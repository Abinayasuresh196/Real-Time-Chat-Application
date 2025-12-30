import multer from "multer";
import path from "path";

// ===============================
// MULTER STORAGE CONFIG
// ===============================
const storage = multer.memoryStorage(); // files stored temporarily in memory

// ===============================
// FILE FILTER
// ===============================
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const isValidExt = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const isValidMime = allowedTypes.test(file.mimetype);

  if (isValidExt && isValidMime) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif)"));
  }
};

// ===============================
// MAX FILE SIZE: 5MB
// ===============================
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

export default upload;
