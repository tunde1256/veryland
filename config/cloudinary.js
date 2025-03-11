const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Make sure to set public access mode while uploading
cloudinary.uploader.upload = async (path, options) => {
  options = { ...options, access_mode: 'public' };  // Make uploaded files publicly accessible
  return cloudinary.uploader.upload(path, options);
};

module.exports = cloudinary;
