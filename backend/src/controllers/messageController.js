import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import cloudinary from "../config/cloudinary.js";

// ===============================
// FETCH ALL MESSAGES FOR A CHAT
// ===============================
export const allMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;

    if (!chatId) {
      const err = new Error("chatId is required");
      err.status = 400;
      throw err;
    }

    const messages = await Message.find({ chat: chatId })
      .populate("sender", "name avatar email")
      .populate("chat")
      .sort({ createdAt: 1 }); // oldest first

    res.json({ success: true, messages });
  } catch (err) {
    next(err);
  }
};

// ===============================
// SEND MESSAGE (TEXT OR IMAGE)
// ===============================
export const sendMessage = async (req, res, next) => {
  try {
    const { content, chatId } = req.body;

    if (!chatId) {
      const err = new Error("chatId is required");
      err.status = 400;
      throw err;
    }

    let messageData = { sender: req.user._id, chat: chatId };

    // Text content
    if (content) messageData.content = content;

    // Optional image upload
    if (req.file) {
      const uploaded = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
          { folder: "messages" },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      messageData.imageUrl = uploaded.secure_url;
      messageData.imagePublicId = uploaded.public_id;
      messageData.type = "image";
    }

    let message = await Message.create(messageData);

    // Update latest message in chat
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

    message = await Message.findById(message._id)
      .populate("sender", "name avatar email")
      .populate("chat");

    res.status(201).json({ success: true, message });
  } catch (err) {
    next(err);
  }
};

// ===============================
// MARK MESSAGE AS READ
// ===============================
export const markAsRead = async (req, res, next) => {
  try {
    const { messageId } = req.body;

    if (!messageId) {
      const err = new Error("messageId is required");
      err.status = 400;
      throw err;
    }

    const message = await Message.findById(messageId);

    if (!message) {
      const err = new Error("Message not found");
      err.status = 404;
      throw err;
    }

    if (!message.readBy.includes(req.user._id)) {
      message.readBy.push(req.user._id);
      await message.save();
    }

    res.json({ success: true, message });
  } catch (err) {
    next(err);
  }
};
