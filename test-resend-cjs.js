const dotenv = require("dotenv");
const path = require("path");
const { Resend } = require("resend");

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, 'backend/.env') });

console.log('Environment variables loaded:');
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'SET' : 'NOT_SET');
console.log('RESEND_API_KEY value:', process.env.RESEND_API_KEY);

async function testResend() {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY is missing! Check your .env file.");
      process.exit(1);
    }

    console.log("✅ RESEND_API_KEY is present");

    const resend = new Resend(process.env.RESEND_API_KEY);

    console.log("✅ Resend client created successfully");

    // Test sending an email
    try {
      console.log("📧 Attempting to send test email...");
      const { data, error } = await resend.emails.send({
        from: "onboarding@resend.dev",
        to: "delivered@resend.dev",
        subject: "Test Email from Chat App",
        html: "<h1>Hello from Real-Time Chat App!</h1><p>This is a test email to verify Resend integration.</p>"
      });

      if (error) {
        console.error("❌ Resend email failed:", error);
      } else {
        console.log("✅ Resend email sent successfully:", data);
      }
    } catch (emailError) {
      console.error("❌ Exception during email sending:", emailError.message);
      console.error("Full error:", emailError);
    }

  } catch (importError) {
    console.error("❌ Failed to import Resend module:", importError.message);
    console.error("This suggests Resend is not properly installed or there's a version issue.");
  }
}

testResend();
