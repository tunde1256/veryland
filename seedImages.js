// require('dotenv').config();  // Load environment variables from .env file

// const Property = require('./models/property'); // Your Property model
// const cloudinary = require('cloudinary').v2;
// const fs = require('fs');
// const path = require('path');

// // Cloudinary Configuration
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // Function to upload image to Cloudinary
// async function uploadImageToCloudinary(imagePath) {
//   try {
//     const result = await cloudinary.uploader.upload(imagePath);
//     console.log(`Image uploaded successfully: ${result.secure_url}`);
//     return result.secure_url;
//   } catch (error) {
//     console.error('Error uploading image to Cloudinary:', error);
//     return null;
//   }
// }

// // Function to generate random price between a given range
// function generateRandomPrice(min, max) {
//   return Math.floor(Math.random() * (max - min + 1)) + min;
// }

// // Function to seed data with image URLs, price, and location (Lagos)
// async function seedImages() {
//     const images = [
//         'image1.jpeg'
//         // 'image2.jpeg',
//         // 'image3.jpeg',
//         // 'image4.jpeg',
//         // 'image5.jpg'
//       ];
      

//   const imagePaths = images.map(image => path.join(__dirname, 'images', image)); // Adjust this path to match your local folder structure

//   const priceMin = 50000; // Minimum price
//   const priceMax = 2000000; // Maximum price

//   // Seeding property data with image URLs, location set to Lagos, and random prices
//   for (const imagePath of imagePaths) {
//     const imageUrl = await uploadImageToCloudinary(imagePath);
//     if (imageUrl) {
//       const price = generateRandomPrice(priceMin, priceMax); // Generate a random price
//       const newProperty = new Property({
//         name: `Sample Property in Lagos`, // Name of the property
//         images: [imageUrl], // You can add multiple images, we are using one for now
//         price: price, // Random price
//         location: {
//           type: 'Point', // GeoJSON type for location
//           coordinates: [6.5244, 3.3792], // Example coordinates for Lagos
//         },
//         address: '1 Lagos Street', // Example address
//         title: `Sample Property in Lagos`, // Example title
//         description: 'This is a sample property in Lagos.',
//       });

//       await newProperty.save();
//       console.log('Property saved with image URL and price:', imageUrl, price);
//     }
//   }
// }

// // Run the seeding function
// seedImages();
require('dotenv').config();
const Property = require('./models/property'); // Your Property model
const cloudinary = require('cloudinary').v2;
const path = require('path');

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to upload image to Cloudinary
async function uploadImageToCloudinary(imagePath) {
  try {
    const result = await cloudinary.uploader.upload(imagePath);
    console.log(`Image uploaded successfully: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    return null;
  }
}

// Function to generate random price between a given range
function generateRandomPrice(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to seed data with image URL, price, and location (Lagos)
async function seedOneImage() {
  const imagePath = path.join(__dirname, 'images', 'image1.jpeg'); // Path to a single image file (modify based on your setup)
  
  const imageUrl = await uploadImageToCloudinary(imagePath);
  
  if (imageUrl) {
    const price = generateRandomPrice(50000, 2000000); // Random price between 50,000 and 2,000,000

    // Coordinates should be in [longitude, latitude] format (GeoJSON)
    const locationCoordinates = [6.5244, 3.3792]; // Example: Longitude and Latitude for Lagos, Nigeria
    
    // Save the property with one image URL
    const newProperty = new Property({
      title: 'Luxury Property in Lagos', // Providing a title
      images: [imageUrl], // One image
      price: price,
      location: {
        type: 'Point', // Location type for GeoJSON format
        coordinates: locationCoordinates, // Longitude and Latitude
      },
      address: '123, Lagos Street, Lagos, Nigeria', // Address field
      description: 'This is a sample property in Lagos with modern facilities and great location.',
    });

    try {
      await newProperty.save();
      console.log('Property saved with image URL and price:', imageUrl, price);
    } catch (error) {
      console.error('Error saving property:', error);
    }
  }
}

// Run the seeding function for one image
seedOneImage();
