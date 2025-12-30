import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';
import Chat from './src/models/Chat.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env' });

async function createSampleData() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');

    // Sample users to create
    const sampleUsers = [
      {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password: 'password123'
      },
      {
        name: 'Bob Smith',
        email: 'bob@example.com',
        password: 'password123'
      },
      {
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        password: 'password123'
      },
      {
        name: 'Diana Prince',
        email: 'diana@example.com',
        password: 'password123'
      }
    ];

    // Create users
    console.log('\n👤 Creating sample users...');
    const createdUsers = [];
    
    for (const userData of sampleUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`   ✅ User already exists: ${userData.name}`);
        createdUsers.push(existingUser);
      } else {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = await User.create({
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          avatar: null
        });
        console.log(`   ✅ Created user: ${userData.name}`);
        createdUsers.push(user);
      }
    }

    // Create sample chats
    console.log('\n💬 Creating sample chats...');
    
    // Private chats
    const aliceBobChat = await Chat.findOne({
      isGroupChat: false,
      users: { $all: [createdUsers[0]._id, createdUsers[1]._id] }
    });
    
    if (!aliceBobChat) {
      await Chat.create({
        chatName: "Alice & Bob",
        isGroupChat: false,
        users: [createdUsers[0]._id, createdUsers[1]._id]
      });
      console.log('   ✅ Created private chat: Alice & Bob');
    }

    const charlieDianaChat = await Chat.findOne({
      isGroupChat: false,
      users: { $all: [createdUsers[2]._id, createdUsers[3]._id] }
    });
    
    if (!charlieDianaChat) {
      await Chat.create({
        chatName: "Charlie & Diana",
        isGroupChat: false,
        users: [createdUsers[2]._id, createdUsers[3]._id]
      });
      console.log('   ✅ Created private chat: Charlie & Diana');
    }

    // Group chat
    const existingGroup = await Chat.findOne({
      isGroupChat: true,
      chatName: "Friends Group"
    });
    
    if (!existingGroup) {
      await Chat.create({
        chatName: "Friends Group",
        isGroupChat: true,
        users: createdUsers.map(u => u._id),
        groupAdmin: createdUsers[0]._id
      });
      console.log('   ✅ Created group chat: Friends Group');
    }

    console.log('\n🎉 Sample data creation completed!');
    console.log('\n📝 Login credentials for testing:');
    sampleUsers.forEach(user => {
      console.log(`   ${user.name}: ${user.email} / password123`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

createSampleData();
