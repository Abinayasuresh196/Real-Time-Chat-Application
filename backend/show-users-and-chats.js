import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Chat from './src/models/Chat.js';

// Load environment variables
dotenv.config({ path: './.env' });

async function showUsersAndChats() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');

    // Get all users
    const users = await User.find().select('name email avatar isOnline lastSeen createdAt');
    console.log('\n📊 Total users in database:', users.length);
    
    if (users.length === 0) {
      console.log('❌ No users found in database. You need to register first.');
      return;
    }

    console.log('\n👥 Users in database:');
    users.forEach((user, index) => {
      const status = user.isOnline ? '🟢 Online' : `🔴 Offline (${user.lastSeen ? user.lastSeen.toLocaleString() : 'Unknown'})`;
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${status}`);
      if (user.avatar) {
        console.log(`   📷 Avatar: ${user.avatar}`);
      }
    });

    // Get all chats
    const chats = await Chat.find()
      .populate('users', 'name email')
      .populate('groupAdmin', 'name email')
      .populate('latestMessage', 'content sender createdAt');
    
    console.log('\n💬 Total chats in database:', chats.length);
    
    if (chats.length === 0) {
      console.log('❌ No chats found in database.');
    } else {
      console.log('\n🗨️ Chats in database:');
      chats.forEach((chat, index) => {
        console.log(`\n${index + 1}. ${chat.chatName}`);
        console.log(`   Type: ${chat.isGroupChat ? 'Group Chat' : 'Private Chat'}`);
        console.log(`   Users: ${chat.users.map(u => u.name).join(', ')}`);
        if (chat.isGroupChat && chat.groupAdmin) {
          console.log(`   Admin: ${chat.groupAdmin.name}`);
        }
        if (chat.latestMessage) {
          console.log(`   Latest: ${chat.latestMessage.sender.name}: ${chat.latestMessage.content}`);
        }
        console.log(`   Created: ${chat.createdAt.toLocaleString()}`);
      });
    }

    // Show user-chat relationships
    console.log('\n🔗 User-Chat Relationships:');
    users.forEach(user => {
      const userChats = chats.filter(chat => 
        chat.users.some(u => u._id.toString() === user._id.toString())
      );
      console.log(`${user.name}: ${userChats.length} chat(s)`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

showUsersAndChats();
