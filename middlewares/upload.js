// middleware/upload.js
const multer = require("multer");
const path = require("path");

// Set up storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Set the destination folder for uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Use original file extension
  },
});

// Create an instance of multer with the storage configuration
const upload = multer({ storage });

module.exports = upload;
