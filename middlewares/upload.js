const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");


// Multer configuration to allow both images and documents
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "land-properties", // A folder specific to land/property uploads
    allowed_formats: ["jpg", "jpeg", "png", "pdf", "docx", "txt"], // Allowing images and documents
  },
});

const upload = multer({ storage });

module.exports = upload;

