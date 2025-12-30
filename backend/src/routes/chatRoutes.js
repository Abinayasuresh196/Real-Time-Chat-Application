import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { 
  accessChat, 
  fetchChats, 
  createGroupChat, 
  renameGroupChat, 
  addToGroup, 
  removeFromGroup 
} from "../controllers/chatController.js";
import User from "../models/User.js";

const router = express.Router();

// ===============================
// CREATE OR GET ONE-TO-ONE CHAT
// ===============================
router.post("/", protect, accessChat);

// ===============================
// FETCH ALL CHATS FOR LOGGED IN USER
// ===============================
router.get("/", protect, fetchChats);

// ===============================
// CREATE GROUP CHAT
// ===============================
router.post("/group", protect, createGroupChat);

// ===============================
// RENAME GROUP CHAT
// ===============================
router.put("/groupname", protect, renameGroupChat);

// ===============================
// ADD USER TO GROUP CHAT
// ===============================
router.put("/groupadd", protect, addToGroup);

// ===============================
// REMOVE USER FROM GROUP CHAT
// ===============================
router.put("/groupremove", protect, removeFromGroup);

// ===============================
// GET ALL USERS (for creating chats)
// ===============================
router.get("/users", protect, async (req, res, next) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("name email avatar isOnline");

    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
});

export default router;
