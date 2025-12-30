/**
 * Debug script for "0 chats" issue in ChatList component
 * This script tests all potential causes of the issue
 */

const { useChatStore } = require('./frontend/src/store/store');
const { chatApi } = require('./frontend/src/api/api');

// Test 1: Check if user is authenticated and available
console.log('=== Test 1: User Authentication Check ===');
const user = useChatStore.getState().user;
console.log('Current user:', user);

if (!user) {
  console.error('❌ ISSUE FOUND: User is not authenticated');
  console.log('The fetchChats function will not be called because user is null/undefined');
} else {
  console.log('✅ User is authenticated:', user._id, user.name);
}

// Test 2: Check if chats are being fetched properly
console.log('\n=== Test 2: API Call Test ===');
async function testFetchChats() {
  try {
    console.log('Attempting to fetch chats...');
    const response = await chatApi.getChats();
    console.log('API Response:', response.data);

    if (response.data && response.data.success) {
      console.log('✅ API call successful');
      console.log('Chats received:', response.data.chats.length);

      if (response.data.chats.length === 0) {
        console.log('ℹ️ No chats exist for this user - this is expected if user has no conversations');
      } else {
        console.log('✅ Chats found:', response.data.chats.length);
      }
    } else {
      console.error('❌ ISSUE FOUND: Invalid response format');
      console.log('Expected: { success: true, chats: [...] }');
      console.log('Received:', response.data);
    }
  } catch (err) {
    console.error('❌ ISSUE FOUND: API call failed');
    console.error('Error:', err.message);
    console.error('Full error:', err);
  }
}

// Test 3: Check if setChats function works properly
console.log('\n=== Test 3: Store Functionality Test ===');
const testChats = [
  {
    _id: 'test-chat-1',
    chatName: 'Test Chat',
    users: [user?._id || 'user1', 'user2'],
    latestMessage: {
      _id: 'msg1',
      content: 'Hello world',
      sender: { _id: 'user2', name: 'Test User' }
    }
  }
];

try {
  useChatStore.getState().setChats(testChats);
  const updatedChats = useChatStore.getState().chats;
  console.log('✅ setChats function works');
  console.log('Chats after update:', updatedChats);
} catch (err) {
  console.error('❌ ISSUE FOUND: setChats function failed');
  console.error('Error:', err);
}

// Test 4: Check if the component is receiving the correct props
console.log('\n=== Test 4: Component Props Check ===');
console.log('This would be checked in the actual component render');

// Test 5: Check WebSocket connection
console.log('\n=== Test 5: WebSocket Connection ===');
const socket = require('./frontend/src/utils/socket').connectSocket(localStorage.getItem('token'));
if (socket) {
  console.log('✅ WebSocket connection established');
} else {
  console.error('❌ ISSUE FOUND: WebSocket connection failed');
}

// Run the API test
if (user) {
  testFetchChats();
} else {
  console.log('Skipping API test because user is not authenticated');
}

// Summary and recommendations
console.log('\n=== DEBUG SUMMARY ===');
console.log('If you see "0 chats", check the following:');
console.log('1. User authentication state (user should not be null)');
console.log('2. API response format (should have { success: true, chats: [...] })');
console.log('3. Network errors in browser console');
console.log('4. Backend server logs for any errors');
console.log('5. Database to ensure chats exist for the user');
console.log('6. WebSocket connection for real-time updates');
