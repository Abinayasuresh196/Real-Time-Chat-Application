import express from "express";
import multer from "multer";

import {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerificationEmail,
  getProfile
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ===============================
// MULTER CONFIG FOR AVATAR UPLOAD
// ===============================
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    const ext = allowed.test(file.originalname.toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error("Only images allowed (jpeg, jpg, png, gif)"));
  }
});

// ===============================
// PUBLIC ROUTES
// ===============================
router.post("/register", upload.single("avatar"), registerUser);
router.post("/login", loginUser);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);

// ===============================
// PROTECTED ROUTES
// ===============================
router.get("/profile", protect, getProfile);
router.post("/logout", protect, (req, res) => {
  // For stateless JWT, we just return success
  // Client should remove token from localStorage
  res.json({ success: true, message: "Logged out successfully" });
});

export default router;
