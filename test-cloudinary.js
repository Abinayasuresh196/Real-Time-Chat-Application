#!/usr/bin/env node

/**
 * Test script to verify Cloudinary configuration
 */

const cloudinary = require('./backend/src/config/cloudinary.js');

console.log('🧪 Testing Cloudinary Configuration...\n');

async function testCloudinary() {
  try {
    console.log('Cloudinary configuration loaded successfully');
    console.log('Cloudinary version:', cloudinary.v2.config().cloud_name);
    
    // Test if we can access the uploader
    console.log('Cloudinary uploader available:', !!cloudinary.v2.uploader);
    
    // Test configuration
    const config = cloudinary.v2.config();
    console.log('Cloudinary config:', {
      cloud_name: config.cloud_name,
      api_key: config.api_key ? 'SET' : 'NOT_SET',
      api_secret: config.api_secret ? 'SET' : 'NOT_SET'
    });
    
    console.log('\n✅ Cloudinary configuration appears to be working');
    
  } catch (error) {
    console.error('❌ Cloudinary configuration error:', error.message);
  }
}

testCloudinary();
