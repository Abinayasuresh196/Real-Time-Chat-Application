💬 Real-Time Chat Application

A modern, secure, and production-ready real-time messaging platform

📌 Project Overview

The Real-Time Chat Application is a feature-rich, full-stack web application built using React.js on the frontend and Node.js with Express on the backend. It enables users to communicate instantly through real-time messaging powered by WebSockets, while ensuring security through JWT authentication, email verification, and robust backend validation. The application supports file uploads, user presence tracking, and a smooth, responsive user interface, making it suitable for real-world production use.

🛠 Technology Stack
Frontend

React.js (Functional Components & Hooks)

Tailwind CSS for modern UI styling

React Router for navigation

Axios for API communication

Zustand for state management

Socket.io Client for real-time communication

Backend

Node.js with Express.js

MongoDB with Mongoose

JWT Authentication

Socket.io for WebSocket-based messaging

Cloudinary for image storage

Resend for email delivery

Multer for file upload handling

✨ Core Features
🔐 User Authentication

User registration with email, password, and profile picture

Secure login and logout using JWT

Password hashing using bcrypt

Protected routes for authenticated users

📧 Email Verification System

Secure email verification using time-limited tokens (24 hours)

Automatic verification email delivery via Resend

Email verification and resend endpoints

Dedicated frontend verification page

Environment-aware email routing (test and production modes)

💬 Real-Time Messaging

Instant message delivery using WebSockets

Online and offline user status

Typing indicators for better user experience

Message read receipts

Presence detection and last-seen tracking

📁 File Uploads

Profile picture uploads during registration

Secure image storage using Cloudinary

File size limits and validation

Optimized image handling

👤 User Management

User profiles with avatar support

User search functionality

Online status indicators

Last active timestamps

📂 Project Structure
backend/
├── src/
│   ├── config/          # Environment & service configurations
│   ├── controllers/     # Application logic
│   ├── middlewares/     # Authentication & error handling
│   ├── models/          # Database schemas
│   ├── routes/          # REST API routes
│   ├── sockets/         # WebSocket logic
│   ├── utils/           # Helper utilities
│   └── app.js           # Express app setup

frontend/
├── src/
│   ├── api/             # API service handlers
│   ├── components/      # Reusable UI components
│   ├── pages/           # Application pages
│   ├── store/           # Zustand state management
│   ├── styles/          # Styling files
│   ├── utils/           # Utility functions
│   └── app/             # Main app configuration

🔄 Email Verification Flow

User registers an account

System generates a secure verification token

Verification email is sent via Resend

User clicks the verification link

Backend validates the token and activates the account

User is redirected to login and granted full access

🔒 Security Features

JWT-based authentication with expiration handling

Password hashing using bcrypt

CORS configuration for API protection

Rate limiting to prevent abuse

Input validation across all endpoints

Secure token generation for email verification

🚀 Current Status
✅ Completed

Fully functional backend API

Complete frontend UI with responsive design

Real-time messaging with Socket.io

Email verification system

File uploads via Cloudinary

JWT authentication & authorization

Zustand-based global state management

Clean routing and protected routes

⚙ Configuration Ready

Development and production environment separation

Resend test and production email modes

Environment variables properly structured

Centralized error handling

🧪 How to Use
Development Mode

Register a new account

Verify email via Resend test dashboard or console link

Login to access chat features

Start real-time conversations

Production Mode

Verify domain in Resend dashboard

Update production environment variables

Deploy backend and frontend

Test with real email addresses

📬 Email Testing

Test Emails Dashboard: https://resend.com/emails

Token validity: 24 hours

Secure token generation and validation

🎯 Conclusion

This Real-Time Chat Application is a complete, scalable, and production-ready system implementing modern web technologies and best practices. With real-time communication, strong authentication, email verification, and secure file handling, it demonstrates full-stack development expertise and readiness for real-world deployment.
