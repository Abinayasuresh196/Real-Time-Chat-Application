import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Message from "../models/Message.js";
import Chat from "../models/Chat.js";

/**
 * Socket Handler Function
 * @param {Server} io - Socket.io Server instance
 */

export const socketHandler = (io) => {
  const onlineUsers = new Map();

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    console.log('Socket authentication attempt with token:', token ? 'TOKEN_PRESENT' : 'NO_TOKEN');
    
    if (!token) {
      console.log('Socket authentication failed: No token provided');
      return next(new Error("Authentication error"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully for user ID:', decoded.id);
    
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      console.log('Socket authentication failed: User not found for ID:', decoded.id);
      return next(new Error("User not found"));
    }

    console.log('Socket authentication successful for user:', user.name);
    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    next(new Error("Authentication error"));
  }
});

  io.on("connection", (socket) => {
    console.log(`🟢 User ${socket.user.name} connected (${socket.id})`);

    // ===============================
    // AUTOMATICALLY JOIN ALL USER'S CHATS ON CONNECTION
    // ===============================
    const joinUserToAllChats = async () => {
      try {
        // Find all chats that this user is a member of
        const userChats = await Chat.find({ users: socket.user._id })
          .select("_id chatName isGroupChat")
          .lean();

        if (userChats.length > 0) {
          console.log(`Auto-joining user ${socket.user.name} to ${userChats.length} chats`);
          
          userChats.forEach(chat => {
            socket.join(`chat_${chat._id}`);
            console.log(`✅ User ${socket.user.name} auto-joined chat: ${chat.chatName} (${chat._id})`);
          });
        }
      } catch (error) {
        console.error("Error auto-joining user to chats:", error);
      }
    };

    // Join user to all their chats immediately after connection
    joinUserToAllChats();

    // ===============================
    // JOIN ROOM (CHAT) - SECURED
    // ===============================
    socket.on("join-room", async (roomId) => {
      try {
        console.log(`User ${socket.user.name} attempting to join room: ${roomId}`);
        
        // Validate that the user is actually a member of this chat
        const chat = await Chat.findOne({
          _id: roomId,
          users: socket.user._id
        }).populate("users", "name avatar email");

        if (!chat) {
          console.log(`❌ Unauthorized: User ${socket.user.name} tried to join non-existent or unauthorized chat: ${roomId}`);
          socket.emit("error", { message: "You are not authorized to join this chat" });
          return;
        }

        // Leave all previous chat rooms first to prevent confusion
        const currentRooms = Array.from(socket.rooms);
        currentRooms.forEach(room => {
          if (room !== socket.id && room.startsWith('chat_')) {
            socket.leave(room);
            console.log(`User ${socket.user.name} left room: ${room}`);
          }
        });

        // Join the new room
        socket.join(`chat_${roomId}`);
        console.log(`✅ User ${socket.user.name} successfully joined chat: ${chat.chatName} (${roomId})`);
        
        // Notify others in the chat that this user joined
        socket.to(`chat_${roomId}`).emit("user-joined-chat", {
          userId: socket.user._id,
          name: socket.user.name,
          chatId: roomId
        });

      } catch (error) {
        console.error("Error joining room:", error);
        socket.emit("error", { message: "Failed to join chat" });
      }
    });

    // ===============================
    // SEND MESSAGE - SECURED
    // ===============================
    socket.on("send-message", async ({ roomId, content, type = "text", imageUrl }) => {
      try {
        console.log(`Message attempt from ${socket.user.name} to chat: ${roomId}`);
        
        // Validate that the user is actually a member of this chat
        const chat = await Chat.findOne({
          _id: roomId,
          users: socket.user._id
        }).populate("users", "name avatar email");

        if (!chat) {
          console.log(`❌ Unauthorized: User ${socket.user.name} tried to send message to unauthorized chat: ${roomId}`);
          socket.emit("error", { message: "You are not authorized to send messages to this chat" });
          return;
        }

        // Validate message content
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
          socket.emit("error", { message: "Message content is required" });
          return;
        }

        // Sanitize content
        const sanitizedContent = content.trim().substring(0, 1000); // Limit to 1000 characters

        // Create message in database - CRITICAL: Don't add sender to readBy
        // This ensures proper unread count calculation
        const messageData = {
          sender: socket.user._id,
          content: sanitizedContent,
          chat: roomId,
          type,
          readBy: [], // Empty readBy array - messages are unread by default
          createdAt: new Date()
        };

        if (type === "image" && imageUrl) {
          // Validate image URL
          if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
            socket.emit("error", { message: "Invalid image URL" });
            return;
          }
          messageData.imageUrl = imageUrl;
        }

        const message = await Message.create(messageData);

        // Update latest message in chat
        await Chat.findByIdAndUpdate(roomId, { latestMessage: message._id });

        // Populate message with sender details
        const fullMessage = await Message.findById(message._id).populate(
          "sender",
          "name avatar email"
        );

        console.log(`✅ Message sent by ${socket.user.name} in chat ${chat.chatName} (${roomId})`);

        // Broadcast message to the chat room using socket.io room broadcasting
        // This ensures the message is delivered to all users who are actually in the chat room
        io.to(`chat_${roomId}`).emit("new-message", { message: fullMessage });
        
        console.log(`📨 Message broadcasted to chat room: chat_${roomId}`);

      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // ===============================
    // TYPING INDICATORS - SECURED
    // ===============================
    socket.on("typing", async ({ roomId }) => {
      try {
        // Validate that the user is actually a member of this chat
        const chat = await Chat.findOne({
          _id: roomId,
          users: socket.user._id
        });

        if (!chat) {
          console.log(`❌ Unauthorized typing from ${socket.user.name} for chat: ${roomId}`);
          return;
        }

        // Send typing indicator to other chat members only
        chat.users.forEach(userId => {
          if (userId.toString() !== socket.user._id.toString()) {
            socket.to(`chat_${roomId}`).emit("typing", {
              chatId: roomId,
              userId: socket.user._id,
              userName: socket.user.name
            });
          }
        });
      } catch (error) {
        console.error("Error sending typing indicator:", error);
      }
    });

    socket.on("stop-typing", async ({ roomId }) => {
      try {
        // Validate that the user is actually a member of this chat
        const chat = await Chat.findOne({
          _id: roomId,
          users: socket.user._id
        });

        if (!chat) {
          return;
        }

        // Send stop typing indicator to other chat members only
        chat.users.forEach(userId => {
          if (userId.toString() !== socket.user._id.toString()) {
            socket.to(`chat_${roomId}`).emit("stop-typing", {
              chatId: roomId,
              userId: socket.user._id
            });
          }
        });
      } catch (error) {
        console.error("Error sending stop typing indicator:", error);
      }
    });

    // ===============================
    // USER ONLINE STATUS
    // ===============================
    socket.on("user-online", async () => {
      const userId = socket.user._id.toString();

      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, socket.id);

        try {
          await User.findByIdAndUpdate(userId, {
            isOnline: true,
            lastSeen: new Date()
          });

          socket.broadcast.emit("user-online", {
            userId: socket.user._id,
            name: socket.user.name
          });
        } catch (error) {
          console.error("Error updating online status:", error);
        }
      }
    });

    // ===============================
    // LEAVE CHAT ROOM
    // ===============================
    socket.on("leave-room", (roomId) => {
      socket.leave(`chat_${roomId}`);
      console.log(`User ${socket.user.name} left room: ${roomId}`);
      
      // Notify others in the chat that this user left
      socket.to(`chat_${roomId}`).emit("user-left-chat", {
        userId: socket.user._id,
        name: socket.user.name,
        chatId: roomId
      });
    });

    // ===============================
    // DISCONNECT
    // ===============================
    socket.on("disconnect", async () => {
      console.log(`🔴 ${socket.user?.name || 'User'} disconnected (${socket.id})`);

      if (socket.user?._id) {
        const userId = socket.user._id.toString();
        onlineUsers.delete(userId);

        try {
          // Update user's online status
          await User.findByIdAndUpdate(
            userId,
            {
              isOnline: false,
              lastSeen: new Date()
            }
          );

          // Notify other users
          socket.broadcast.emit("user-offline", {
            userId: socket.user._id,
            name: socket.user.name,
            lastSeen: new Date()
          });
        } catch (err) {
          console.error("Error updating user status on disconnect:", err.message);
        }
      }

      // Leave all chat rooms
      const rooms = Object.keys(socket.rooms);
      rooms.forEach(room => {
        if (room !== socket.id && room.startsWith('chat_')) {
          socket.leave(room);
        }
      });
    });
  });
};
