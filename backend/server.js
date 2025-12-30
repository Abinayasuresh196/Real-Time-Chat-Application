// Load environment variables first
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
console.log('Loading environment variables from:', path.join(__dirname, '.env'));
dotenv.config({ path: path.join(__dirname, '.env') });

// Force reload environment variables
dotenv.config({ path: path.join(__dirname, '.env'), override: true });

console.log('Environment variables loaded:');
console.log('CLOUDINARY_URL:', process.env.CLOUDINARY_URL ? 'SET' : 'NOT_SET');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME || 'NOT_SET');
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT_SET');
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT_SET');
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'SET' : 'NOT_SET');

// If environment variables are still not loaded, try loading from parent directory
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  console.log('Trying to load from parent directory...');
  dotenv.config({ path: path.join(__dirname, '../.env'), override: true });
  console.log('CLOUDINARY_CLOUD_NAME after parent dir load:', process.env.CLOUDINARY_CLOUD_NAME || 'STILL NOT SET');
}
import http from "http";
import { Server } from "socket.io";

import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { socketHandler } from "./src/sockets/socket.js";

// ===============================
// DATABASE CONNECTION
// ===============================
connectDB();

// ===============================
// CREATE HTTP SERVER
// ===============================
const server = http.createServer(app);

// ===============================
// SOCKET.IO SETUP
// ===============================
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Authorization", "Content-Type"],
    transports: ["websocket", "polling"]
  }
});

// Attach socket logic
socketHandler(io);

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
});

// ===============================
// GLOBAL ERROR SAFETY
// ===============================
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err.message);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
  process.exit(1);
});
