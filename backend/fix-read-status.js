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

const fixReadStatus = async () => {
  try {
    console.log("🔧 Starting read status fix...");

    // Get all messages and fix their readBy arrays
    const allMessages = await Message.find({});
    let fixedCount = 0;

    for (const message of allMessages) {
      const originalReadBy = [...message.readBy]; // Copy for logging
      
      // Only the sender should be in readBy array initially
      const correctReadBy = [message.sender];
      
      // Only update if the readBy array is different
      if (JSON.stringify(message.readBy) !== JSON.stringify(correctReadBy)) {
        message.readBy = correctReadBy;
        await message.save();
        fixedCount++;
        console.log(`Fixed message ${message._id}: [${originalReadBy.join(', ')}] -> [${correctReadBy.join(', ')}]`);
      }
    }

    console.log(`\n✅ Fixed read status for ${fixedCount} messages`);
    
    // Show summary
    const userCount = await User.countDocuments();
    const chatCount = await Chat.countDocuments();
    const messageCount = await Message.countDocuments();
    
    console.log("\n📊 Database Summary:");
    console.log("========================");
    console.log(`👥 Total Users: ${userCount}`);
    console.log(`💬 Total Chats: ${chatCount}`);
    console.log(`📨 Total Messages: ${messageCount}`);
    
    console.log("\n✅ Read status fix completed successfully!");
    
  } catch (error) {
    console.error("❌ Error during read status fix:", error.message);
  }
};

// Run fix
const runFix = async () => {
  await connectDB();
  await fixReadStatus();
  await mongoose.connection.close();
  console.log("🔌 MongoDB connection closed");
};

runFix();
