import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit"; // replaced @arcjet/node
import morgan from "morgan";

import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

import { errorHandler } from "./middlewares/errorMiddleware.js";

const app = express();

// ===============================
// GLOBAL MIDDLEWARES
// ===============================
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

// Parse JSON body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging (dev-friendly)
app.use(morgan("dev"));

// ===============================
// RATE LIMITING (express-rate-limit)
// ===============================
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,                 // limit each IP to 60 requests per window
  standardHeaders: true,   // return rate limit info in headers
  legacyHeaders: false,    // disable `X-RateLimit-*` headers
  message: {
    success: false,
    message: "Too many requests. Please try again later."
  }
});

app.use(limiter);

// ===============================
// ROUTES
// ===============================
app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

// ===============================
// HEALTH CHECK (optional)
// ===============================
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Backend is healthy 🚀" });
});

// ===============================
// ERROR HANDLER (CENTRAL)
// ===============================
app.use(errorHandler);

export default app;
