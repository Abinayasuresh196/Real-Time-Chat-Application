import mongoose from "mongoose";
import User from "./src/models/User.js";
import Chat from "./src/models/Chat.js";
import Message from "./src/models/Message.js";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

const cleanupDatabase = async () => {
  try {
    console.log("🧹 Starting database cleanup...");

    // 1. Clean up orphaned messages (messages with invalid chat references)
    console.log("1. Cleaning up orphaned messages...");
    const orphanedMessages = await Message.find({
      chat: { $exists: false }
    });
    console.log(`Found ${orphanedMessages.length} orphaned messages`);

    // Get all valid chat IDs
    const validChatIds = await Chat.find({}, "_id").distinct("_id");
    const validChatIdStrings = validChatIds.map(id => id.toString());

    // Remove messages that reference non-existent chats
    const deletedOrphanedMessages = await Message.deleteMany({
      chat: { $nin: validChatIdStrings }
    });
    console.log(`🗑️ Deleted ${deletedOrphanedMessages.deletedCount} orphaned messages`);

    // 2. Clean up chats with invalid user references
    console.log("2. Cleaning up invalid chat user references...");
    const allUserIds = await User.find({}, "_id").distinct("_id");
    const validUserIdStrings = allUserIds.map(id => id.toString());

    // Update chats to remove invalid user references from users array
    const updatedChats = await Chat.updateMany(
      {},
      {
        $pull: {
          users: { $nin: validUserIdStrings }
        }
      }
    );

    // Remove invalid groupAdmin references (since groupAdmin is a single ObjectId, not an array)
    const updatedGroupAdmins = await Chat.updateMany(
      {
        groupAdmin: { $nin: validUserIdStrings }
      },
      {
        $unset: { groupAdmin: 1 }
      }
    );
    console.log(`🔧 Updated ${updatedChats.modifiedCount} chats to remove invalid users`);
    console.log(`🔧 Updated ${updatedGroupAdmins.modifiedCount} chats to remove invalid groupAdmin references`);

    // 3. Remove chats that have no users
    console.log("3. Removing empty chats...");
    const emptyChats = await Chat.find({ users: { $size: 0 } });
    const deletedEmptyChats = await Chat.deleteMany({ users: { $size: 0 } });
    console.log(`🗑️ Deleted ${deletedEmptyChats.deletedCount} empty chats`);

    // 4. Update latestMessage references
    console.log("4. Updating latestMessage references...");
    const allMessageIds = await Message.find({}, "_id").distinct("_id");
    const validMessageIdStrings = allMessageIds.map(id => id.toString());

    // Update chats to reference only valid messages
    const updatedLatestMessages = await Chat.updateMany(
      { latestMessage: { $nin: validMessageIdStrings } },
      { $unset: { latestMessage: 1 } }
    );
    console.log(`🔧 Updated ${updatedLatestMessages.modifiedCount} chats to fix latestMessage references`);

    // 5. Clean up messages with invalid sender references
    console.log("5. Cleaning up messages with invalid senders...");
    const deletedInvalidSenders = await Message.deleteMany({
      sender: { $nin: validUserIdStrings }
    });
    console.log(`🗑️ Deleted ${deletedInvalidSenders.deletedCount} messages with invalid senders`);

    // 6. Clean up readBy arrays in messages
    console.log("6. Cleaning up readBy arrays...");
    const updatedReadBy = await Message.updateMany(
      {},
      {
        $pull: {
          readBy: { $nin: validUserIdStrings }
        }
      }
    );
    console.log(`🔧 Updated ${updatedReadBy.modifiedCount} messages to clean readBy arrays`);

    // 7. Reset all unread counts by ensuring readBy arrays are properly set
    console.log("7. Ensuring all messages have proper readBy arrays...");
    const allMessages = await Message.find({});
    let updatedCount = 0;
    
    for (const message of allMessages) {
      if (!message.readBy || !Array.isArray(message.readBy)) {
        message.readBy = [];
        await message.save();
        updatedCount++;
      }
      
      // Ensure sender is in readBy array
      if (message.sender && !message.readBy.includes(message.sender)) {
        message.readBy.push(message.sender);
        await message.save();
        updatedCount++;
      }
    }
    console.log(`🔧 Fixed readBy arrays for ${updatedCount} messages`);

    // 8. Generate cleanup report
    console.log("\n📊 Database Cleanup Report:");
    console.log("========================");
    
    const userCount = await User.countDocuments();
    const chatCount = await Chat.countDocuments();
    const messageCount = await Message.countDocuments();
    
    console.log(`👥 Total Users: ${userCount}`);
    console.log(`💬 Total Chats: ${chatCount}`);
    console.log(`📨 Total Messages: ${messageCount}`);
    
    // Show chat breakdown
    const groupChats = await Chat.countDocuments({ isGroupChat: true });
    const privateChats = await Chat.countDocuments({ isGroupChat: false });
    console.log(`👥 Group Chats: ${groupChats}`);
    console.log(`👤 Private Chats: ${privateChats}`);

    console.log("\n✅ Database cleanup completed successfully!");
    
  } catch (error) {
    console.error("❌ Error during cleanup:", error.message);
  }
};

// Run cleanup
const runCleanup = async () => {
  await connectDB();
  await cleanupDatabase();
  await mongoose.connection.close();
  console.log("🔌 MongoDB connection closed");
};

runCleanup();
