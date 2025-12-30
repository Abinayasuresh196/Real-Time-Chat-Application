const dotenv = require('dotenv');
const { Resend } = require('resend');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(process.cwd(), 'backend/.env') });

console.log('Testing Resend API...');
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'SET' : 'NOT_SET');

async function testResend() {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY is missing! Check your .env file in the backend directory.');
      process.exit(1);
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    console.log('✅ Resend client created successfully');

    const testEmail = 'delivered@resend.dev'; // This is a special test email from Resend
    
    console.log('📧 Attempting to send test email to:', testEmail);
    
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: testEmail,
      subject: 'Test Email from Chat App',
      html: '<h1>Hello from Chat App!</h1><p>This is a test email to verify Resend integration.</p>'
    });

    if (error) {
      console.error('❌ Resend email failed:', error);
      if (error.message.includes('API key is invalid')) {
        console.error('\n🔑 The provided RESEND_API_KEY appears to be invalid.');
        console.error('Please check your Resend dashboard and update the .env file with a valid API key.');
      }
    } else {
      console.log('✅ Resend email sent successfully!');
      console.log('Response data:', data);
      console.log('\n📬 Check your email at https://resend.com/emails');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testResend();
