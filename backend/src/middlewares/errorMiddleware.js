// ===============================
// CENTRALIZED ERROR HANDLER
// ===============================
export const errorHandler = (err, req, res, next) => {
  // Default status code
  const statusCode = err.status || 500;

  // Log server-side error for debugging
  console.error(`❌ ${err.name}: ${err.message}`);

  // Send friendly JSON response to frontend
  res.status(statusCode).json({
    success: false,
    message: err.message || "Something went wrong",
    // Optional: show stack in development only
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
};
