import express from "express";
import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import { protect } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// ===============================
// FETCH ALL MESSAGES FOR A CHAT
// ===============================
router.get("/:chatId", protect, async (req, res, next) => {
  try {
    const { chatId } = req.params;

    const messages = await Message.find({ chat: chatId })
      .populate("sender", "name avatar email")
      .populate("chat")
      .sort({ createdAt: 1 }); // oldest first

    res.json({ success: true, messages });
  } catch (err) {
    next(err);
  }
});

// ===============================
// SEND MESSAGE
// ===============================
router.post("/", protect, async (req, res, next) => {
  try {
    const { chatId, content } = req.body;

    if (!chatId || !content) {
      const err = new Error("chatId and content are required");
      err.status = 400;
      throw err;
    }

    // CRITICAL: Don't add sender to readBy to ensure proper unread count calculation
    const message = await Message.create({
      sender: req.user._id,
      content,
      chat: chatId,
      readBy: [], // Empty readBy array - messages are unread by default
    });

    // Update latest message in chat
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

    const fullMessage = await Message.findById(message._id).populate(
      "sender",
      "name avatar email"
    );

    res.status(201).json({ success: true, message: fullMessage });
  } catch (err) {
    next(err);
  }
});

// ===============================
// MARK MESSAGES AS READ
// ===============================
router.post("/mark-read", protect, async (req, res, next) => {
  try {
    const { messageIds } = req.body;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      const err = new Error("messageIds array is required");
      err.status = 400;
      throw err;
    }

    // Update all specified messages to mark them as read by the current user
    const result = await Message.updateMany(
      { 
        _id: { $in: messageIds },
        sender: { $ne: req.user._id } // Only mark messages received by the user as read
      },
      { 
        $addToSet: { readBy: req.user._id }
      }
    );

    res.json({ 
      success: true, 
      message: `${result.modifiedCount} messages marked as read`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    next(err);
  }
});

// ===============================
// UPLOAD FILE (IMAGE)
// ===============================
router.post("/upload", protect, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error("No file uploaded");
      err.status = 400;
      throw err;
    }

    const { chatId } = req.body;

    if (!chatId) {
      const err = new Error("chatId is required");
      err.status = 400;
      throw err;
    }

    // Upload to Cloudinary from memory buffer
    let result;
    try {
      console.log("Attempting Cloudinary upload...");
      console.log("Cloudinary config:", {
        cloudinary_url: process.env.CLOUDINARY_URL ? "SET" : "NOT_SET",
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY ? "SET" : "NOT_SET",
        api_secret: process.env.CLOUDINARY_API_SECRET ? "SET" : "NOT_SET"
      });
      console.log("File details:", {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer_length: req.file.buffer.length
      });

      // Convert buffer to base64 data URI for Cloudinary upload
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      
      result = await cloudinary.uploader.upload(base64Image, {
        folder: "chat_images",
        resource_type: "image",
        transformation: [
          { width: 800, height: 600, crop: "limit" },
          { quality: "auto:good" }
        ],
        public_id: `${req.user._id}_${Date.now()}` // Unique public ID
      });
      
      console.log("Cloudinary upload successful:", {
        secure_url: result.secure_url,
        public_id: result.public_id,
        original_filename: result.original_filename
      });
    } catch (cloudinaryError) {
      console.error("Cloudinary upload failed:", cloudinaryError);
      console.error("Cloudinary error details:", {
        message: cloudinaryError.message,
        name: cloudinaryError.name,
        http_code: cloudinaryError.http_code,
        error: cloudinaryError.error
      });
      
      const err = new Error("Failed to upload image to Cloudinary");
      err.status = 500;
      throw err;
    }

    // Create message with image URL - CRITICAL: Don't add sender to readBy
    const message = await Message.create({
      sender: req.user._id,
      content: req.file.originalname || 'Image',
      chat: chatId,
      type: "image",
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
      readBy: [], // Empty readBy array - messages are unread by default
    });

    // Update latest message in chat
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

    const fullMessage = await Message.findById(message._id).populate(
      "sender",
      "name avatar email"
    );

    res.status(201).json({ 
      success: true, 
      message: fullMessage,
      imageUrl: result.secure_url 
    });
  } catch (err) {
    console.error("Upload error:", err);
    next(err);
  }
});
export default router;
