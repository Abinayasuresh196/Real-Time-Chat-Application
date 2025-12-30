import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cloudinary from "cloudinary";

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
console.log("Loading environment variables from:", path.join(__dirname, '../../.env'));
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log("Cloudinary config loading...");
console.log("CLOUDINARY_URL:", process.env.CLOUDINARY_URL ? "SET" : "NOT_SET");
console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY ? "SET" : "NOT_SET");
console.log("CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "SET" : "NOT_SET");

// Use individual environment variables (more reliable than CLOUDINARY_URL)
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  console.log("Using individual environment variables");
  console.log("Cloudinary config details:", {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET ? "SET" : "NOT_SET"
  });
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else if (process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL.trim() !== '') {
  console.log("Using CLOUDINARY_URL configuration");
  cloudinary.v2.config({
    cloudinary_url: process.env.CLOUDINARY_URL
  });
} else {
  console.error("❌ Cloudinary configuration failed: Missing required environment variables");
  console.error("Please ensure CLOUDINARY_URL or individual CLOUDINARY_* variables are set");
}

export default cloudinary;
