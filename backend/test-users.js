import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

// Load environment variables
dotenv.config({ path: './.env' });

// If MONGO_URI is still undefined, try loading from parent directory
if (!process.env.MONGO_URI) {
  console.log('MONGO_URI not found, trying parent directory...');
  dotenv.config({ path: '../.env' });
}

async function testUsers() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');

    // Get all users
    const users = await User.find().select('name email createdAt');
    console.log('📊 Total users in database:', users.length);
    
    if (users.length === 0) {
      console.log('❌ No users found in database. You need to register first.');
    } else {
      console.log('👥 Users in database:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - Created: ${user.createdAt}`);
      });
    }

    // Test a sample login
    if (users.length > 0) {
      console.log('\n🧪 Testing login with first user...');
      const testUser = users[0];
      console.log(`Trying to login with: ${testUser.email}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
}

testUsers();
