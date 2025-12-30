import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ===============================
// PROTECT ROUTES MIDDLEWARE
// ===============================
export const protect = async (req, res, next) => {
  let token;

  try {
    // Check for Bearer token in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      const err = new Error("Not authorized, token missing");
      err.status = 401;
      throw err;
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) throw new Error("Invalid token");

    // Fetch user and exclude password
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      const err = new Error("Not authorized, user not found");
      err.status = 401;
      throw err;
    }

    // Attach user to request for controllers & Socket.io
    req.user = user;
    next();
  } catch (error) {
    // Centralized error handling
    error.status = error.status || 401;
    error.message = error.message || "Not authorized";
    next(error);
  }
};
