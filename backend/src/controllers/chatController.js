import Chat from "../models/Chat.js";
import User from "../models/User.js";
import Message from "../models/Message.js";

// ===============================
// ACCESS OR CREATE ONE-TO-ONE CHAT
// ===============================
export const accessChat = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      const err = new Error("userId is required");
      err.status = 400;
      throw err;
    }

    // Find existing one-to-one chat
    let chat = await Chat.findOne({
      isGroupChat: false,
      users: { $all: [req.user._id, userId] }
    })
      .populate("users", "name avatar email")
      .populate({
        path: "latestMessage",
        populate: {
          path: "sender",
          select: "name avatar email"
        }
      });

    if (chat) return res.json({ success: true, chat });

    // Create new one-to-one chat if not exists
    chat = await Chat.create({
      chatName: "Private Chat",
      users: [req.user._id, userId]
    });

    chat = await Chat.findById(chat._id)
      .populate("users", "name avatar email")
      .populate({
        path: "latestMessage",
        populate: {
          path: "sender",
          select: "name avatar email"
        }
      });

    res.status(201).json({ success: true, chat });
  } catch (err) {
    next(err);
  }
};

// ===============================
// FETCH ALL CHATS FOR LOGGED IN USER
// ===============================
export const fetchChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({ users: { $in: [req.user._id] } })
      .populate("users", "name avatar email")
      .populate("groupAdmin", "name avatar email")
      .populate({
        path: "latestMessage",
        populate: {
          path: "sender",
          select: "name avatar email"
        }
      })
      .populate({
        path: "latestMessage",
        populate: {
          path: "readBy",
          select: "_id"
        }
      })
      .sort({ updatedAt: -1 });

    // Calculate unread count for each chat
    const chatsWithUnreadCount = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chat: chat._id,
          sender: { $ne: req.user._id },
          readBy: { $ne: req.user._id }
        });
        
        return {
          ...chat.toObject(),
          unreadCount
        };
      })
    );

    res.json({ success: true, chats: chatsWithUnreadCount });
  } catch (err) {
    next(err);
  }
};

// ===============================
// CREATE GROUP CHAT
// ===============================
export const createGroupChat = async (req, res, next) => {
  try {
    const { name, userIds } = req.body;

    if (!name || !userIds || userIds.length < 2) {
      const err = new Error("Group name and at least 2 users required");
      err.status = 400;
      throw err;
    }

    const groupChat = await Chat.create({
      chatName: name,
      isGroupChat: true,
      users: [req.user._id, ...userIds],
      groupAdmin: req.user._id
    });

    const fullGroup = await Chat.findById(groupChat._id)
      .populate("users", "name avatar email")
      .populate("groupAdmin", "name avatar email");

    res.status(201).json({ success: true, chat: fullGroup });
  } catch (err) {
    next(err);
  }
};

// ===============================
// RENAME GROUP CHAT
// ===============================
export const renameGroupChat = async (req, res, next) => {
  try {
    const { chatId, chatName } = req.body;

    const chat = await Chat.findByIdAndUpdate(
      chatId,
      { chatName },
      { new: true }
    ).populate("users", "name avatar email");

    if (!chat) {
      const err = new Error("Chat not found");
      err.status = 404;
      throw err;
    }

    res.json({ success: true, chat });
  } catch (err) {
    next(err);
  }
};

// ===============================
// ADD USER TO GROUP
// ===============================
export const addToGroup = async (req, res, next) => {
  try {
    const { chatId, userId } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) throw new Error("Chat not found");
    if (!chat.isGroupChat) throw new Error("Not a group chat");

    if (!chat.users.includes(userId)) chat.users.push(userId);
    await chat.save();

    const fullChat = await Chat.findById(chat._id)
      .populate("users", "name avatar email")
      .populate("groupAdmin", "name avatar email");

    res.json({ success: true, chat: fullChat });
  } catch (err) {
    next(err);
  }
};

// ===============================
// REMOVE USER FROM GROUP
// ===============================
export const removeFromGroup = async (req, res, next) => {
  try {
    const { chatId, userId } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) throw new Error("Chat not found");

    chat.users = chat.users.filter((u) => u.toString() !== userId);
    await chat.save();

    const fullChat = await Chat.findById(chat._id)
      .populate("users", "name avatar email")
      .populate("groupAdmin", "name avatar email");

    res.json({ success: true, chat: fullChat });
  } catch (err) {
    next(err);
  }
};
