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

const findAndRemoveDuplicateImages = async () => {
  try {
    console.log("🔍 Finding duplicate image messages...");

    // Find all image messages
    const imageMessages = await Message.find({ type: "image" }).sort({ createdAt: 1 });
    console.log(`Found ${imageMessages.length} total image messages`);

    // Group messages by chat and content to find duplicates
    const duplicateGroups = new Map();
    
    for (const msg of imageMessages) {
      const key = `${msg.chat}-${msg.content}-${msg.imageUrl}`;
      if (!duplicateGroups.has(key)) {
        duplicateGroups.set(key, []);
      }
      duplicateGroups.get(key).push(msg);
    }

    // Find groups with duplicates
    const duplicates = [];
    for (const [key, messages] of duplicateGroups) {
      if (messages.length > 1) {
        duplicates.push({ key, messages });
      }
    }

    if (duplicates.length === 0) {
      console.log("✅ No duplicate image messages found");
      return;
    }

    console.log(`\n🔍 Found ${duplicates.length} groups of duplicate images:`);

    let totalDeleted = 0;
    for (const group of duplicates) {
      const messages = group.messages;
      // Keep the first message, remove the rest
      const toKeep = messages[0];
      const toDelete = messages.slice(1);
      
      console.log(`\nChat: ${toKeep.chat}, Image: ${toKeep.imageUrl}`);
      console.log(`Keeping: ${toKeep._id} (${toKeep.createdAt})`);
      console.log(`Deleting ${toDelete.length} duplicates:`);
      
      for (const msg of toDelete) {
        console.log(`  - ${msg._id} (${msg.createdAt})`);
      }
      
      // Delete the duplicates
      const deleteResult = await Message.deleteMany({
        _id: { $in: toDelete.map(m => m._id) }
      });
      
      totalDeleted += deleteResult.deletedCount;
      console.log(`🗑️ Deleted ${deleteResult.deletedCount} duplicate messages`);
    }

    console.log(`\n✅ Removed ${totalDeleted} duplicate image messages`);

    // Show summary
    const remainingImageMessages = await Message.countDocuments({ type: "image" });
    console.log(`📊 Remaining image messages: ${remainingImageMessages}`);
    
    const totalMessages = await Message.countDocuments();
    console.log(`📊 Total messages: ${totalMessages}`);

    console.log("\n✅ Duplicate image cleanup completed successfully!");
    
  } catch (error) {
    console.error("❌ Error during duplicate cleanup:", error.message);
  }
};

// Run cleanup
const runCleanup = async () => {
  await connectDB();
  await findAndRemoveDuplicateImages();
  await mongoose.connection.close();
  console.log("🔌 MongoDB connection closed");
};

runCleanup();
