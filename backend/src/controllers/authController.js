import bcrypt from "bcryptjs";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import { resend } from "../config/resend.js";
import generateToken from "../utils/generateToken.js";
import { generateVerificationToken } from "../utils/generateVerificationToken.js";

// REGISTER
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) throw new Error("Email already registered");

    const hashedPassword = await bcrypt.hash(password, 10);

    let avatarUrl;
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
          { folder: "avatars" },
          (err, result) => err ? reject(err) : resolve(result)
        );
        stream.end(req.file.buffer);
      });
      avatarUrl = result.secure_url;
    }

    // Generate verification token
    const { token: verificationToken, expires: verificationTokenExpires } = generateVerificationToken();

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      avatar: avatarUrl,
      verificationToken,
      verificationTokenExpires
    });

    // Generate JWT token for immediate login
    const jwtToken = generateToken(user._id);

    // Send verification email
    try {
      const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

      // Use Resend's test address for reliable delivery during development
      // Change to 'email' for production after domain verification
      const senderEmail = process.env.RESEND_SENDER_EMAIL || "onboarding@resend.dev";
      const recipientEmail = process.env.NODE_ENV === 'production' ? email : 'delivered@resend.dev';

      const emailResponse = await resend.emails.send({
        from: senderEmail,
        to: recipientEmail,
        subject: `Verify Your Email for Chat App, ${name}! 🔐`,
        html: `
          <h1>Welcome to Chat App, ${name}!</h1>
          <p>Thank you for registering. Please verify your email address to complete your registration.</p>
          <p>Click the button below to verify your email:</p>
          <a href="${verificationUrl}" style="
            display: inline-block;
            padding: 12px 24px;
            background-color: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 16px 0;
          ">Verify Email</a>
          <p>Or copy and paste this URL into your browser:</p>
          <p>${verificationUrl}</p>
          <p>This verification link will expire in 24 hours.</p>
        `
      });

      console.log(`✅ Verification email sent to ${email}`);
      console.log('📬 Email response:', emailResponse);
      console.log('🔗 Verification URL:', verificationUrl);
      console.log('📋 Check Resend dashboard: https://resend.com/emails');

      // In development, provide link to check test emails
      if (process.env.NODE_ENV === 'development') {
        console.log('📬 Check test email at: https://resend.com/emails');
        console.log(`🔗 Verification link for ${email}: ${verificationUrl}`);
      }
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);

      // Provide detailed error information for debugging
      if (emailError.message.includes('domain not verified')) {
        console.error('⚠️ Domain verification required for real email addresses');
        console.error('📋 Please verify your domain in Resend dashboard: https://resend.com/domains');
        console.error('💡 For testing, emails are sent to delivered@resend.dev');
        console.error(`🔗 Verification link: ${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`);
      } else if (emailError.message.includes('API key is invalid')) {
        console.error('❌ Invalid Resend API key - check your .env file');
      } else {
        console.error('Email sending error details:', emailError);
      }

      // Don't fail the registration if email sending fails
    }

    res.status(201).json({
      success: true,
      user: user.toJSON(),
      token: jwtToken,
      message: "Registration successful! Please check your email to verify your account."
    });

  } catch (err) {
    next(err);
  }
};

// LOGIN
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('Login failed: User not found for email:', email);
      // Let's also check if there are any users in the database
      const allUsers = await User.find().select('email name');
      console.log('All users in database:', allUsers);
      const err = new Error("Invalid credentials");
      err.status = 401;
      throw err;
    }

    console.log('User found:', user.name);
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log('Login failed: Password mismatch for user:', user.name);
      const err = new Error("Invalid credentials");
      err.status = 401;
      throw err;
    }

    console.log('Login successful for user:', user.name);
    res.json({
      success: true,
      user: user.toJSON(),
      token: generateToken(user._id)
    });

  } catch (err) {
    console.error('Login error:', err.message);
    next(err);
  }
};

// VERIFY EMAIL
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      const err = new Error("Verification token is required");
      err.status = 400;
      throw err;
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      const err = new Error("Invalid or expired verification token");
      err.status = 400;
      throw err;
    }

    // Mark user as verified
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Email verified successfully! You can now use all features of the app."
    });

  } catch (err) {
    next(err);
  }
};

// RESEND VERIFICATION EMAIL
export const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }

    if (user.isVerified) {
      const err = new Error("Email already verified");
      err.status = 400;
      throw err;
    }

    // Generate new verification token
    const { token: verificationToken, expires: verificationTokenExpires } = generateVerificationToken();

    // Update user with new token
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationTokenExpires;
    await user.save();

    // Send verification email
    try {
      const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

      // Use custom sender email if configured, otherwise use Resend's default
      const senderEmail = process.env.RESEND_SENDER_EMAIL || "onboarding@resend.dev";

      const emailResponse = await resend.emails.send({
        from: senderEmail,
        to: email,
        subject: `Verify Your Email for Chat App, ${user.name}! 🔐`,
        html: `
          <h1>Verify Your Email, ${user.name}!</h1>
          <p>Please verify your email address to complete your registration.</p>
          <p>Click the button below to verify your email:</p>
          <a href="${verificationUrl}" style="
            display: inline-block;
            padding: 12px 24px;
            background-color: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 16px 0;
          ">Verify Email</a>
          <p>Or copy and paste this URL into your browser:</p>
          <p>${verificationUrl}</p>
          <p>This verification link will expire in 24 hours.</p>
        `
      });

      console.log(`Verification email resent to ${email}`);
      console.log('Email response:', emailResponse);
    } catch (emailError) {
      console.error('Failed to resend verification email:', emailError);

      // Provide detailed error information
      if (emailError.message.includes('domain not verified')) {
        console.error('⚠️ Domain verification required for real email addresses');
        console.error('📋 Please verify your domain in Resend dashboard: https://resend.com/domains');
      } else if (emailError.message.includes('API key is invalid')) {
        console.error('❌ Invalid Resend API key - check your .env file');
      } else {
        console.error('Email sending error details:', emailError);
      }

      const err = new Error("Failed to send verification email");
      err.status = 500;
      throw err;
    }

    res.json({
      success: true,
      message: "Verification email sent successfully. Please check your email."
    });

  } catch (err) {
    next(err);
  }
};

// PROFILE
export const getProfile = async (req, res, next) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (err) {
    next(err);
  }
};
