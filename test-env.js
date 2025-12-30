#!/usr/bin/env node

/**
 * Test script to verify environment variables
 */

console.log('🧪 Testing Environment Variables...\n');

console.log('CLOUDINARY_URL:', process.env.CLOUDINARY_URL ? 'SET' : 'NOT_SET');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME || 'NOT_SET');
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT_SET');
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT_SET');

console.log('\nAll environment variables:');
Object.keys(process.env).forEach(key => {
  if (key.includes('CLOUDINARY') || key.includes('NODE_ENV') || key.includes('PORT')) {
    console.log(`${key}: ${process.env[key]}`);
  }
});

console.log('\n✅ Environment variable test complete');
