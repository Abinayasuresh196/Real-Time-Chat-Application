import { io } from "socket.io-client";

// Test WebSocket connection
const testWebSocketConnection = async () => {
  console.log("Testing WebSocket connection...");

  // Get token from localStorage (simulate user being logged in)
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("No token found. Please log in first.");
    return;
  }

  console.log("Token found:", token.substring(0, 20) + "...");

  try {
    const socket = io("http://localhost:5000", {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 30000,
      autoConnect: true,
      withCredentials: true,
      forceNew: false,
      reconnection: true,
      randomizationFactor: 0.5,
    });

    socket.on("connect", () => {
      console.log("✅ WebSocket connected successfully:", socket.id);
      socket.disconnect();
    });

    socket.on("connect_error", (err) => {
      console.error("❌ WebSocket connection error:", err.message);
      console.error("Full error:", err);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔴 WebSocket disconnected:", reason);
    });

  } catch (error) {
    console.error("Exception during WebSocket test:", error);
  }
};

// Run the test
testWebSocketConnection();
