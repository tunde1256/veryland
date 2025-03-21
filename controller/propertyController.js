const Property = require("../models/property");
const opencage = require("opencage-api-client");
const { encryptDocument, decryptDocument } = require('../utils/encryptionUtils'); // Import the encryption functions
const fs = require('fs');
const { createNotification } = require("../controller/notificationService");


const OPENCAGE_API_KEY = process.env.OPENCAGE_API_KEY || "46e202a2c1f64c8d84a6deb9b375e9ef";


exports.getAllProperties = async (req, res) => {
  try {
    const properties = await Property.find().populate("seller", "fullname email");
    res.status(200).json(properties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPropertyDetails = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate("seller", "fullname email");
    if (!property) return res.status(404).json({ message: "Property not found" });
    res.status(200).json(property);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getRandomProperties = async (req, res) => {
  try {
    const randomProperties = await Property.aggregate([
      { $sample: { size: 10 } } // Adjust the size if you want more or fewer random properties
    ]);

    if (randomProperties.length === 0) {
      return res.status(404).json({ message: "No properties found" });
    }

    res.status(200).json({
      success: true,
      message: "Random properties retrieved successfully",
      data: randomProperties,
    });
  } catch (error) {
    console.error("Error retrieving random properties:", error);
    res.status(500).json({ error: error.message });
  }
};


exports.deleteProperty = async (req, res) => {
  try {
    const deletedProperty = await Property.findByIdAndDelete(req.params.id);
    if (!deletedProperty) return res.status(404).json({ message: "Property not found" });
    res.status(200).json({ message: "Property removed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.listProperty = async (req, res) => {
  try {
    console.log("Files in req.files:", JSON.stringify(req.files, null, 2));

    if (!req.files || (!req.files.images && !req.files.documents)) {
      return res.status(400).json({ error: "At least one image or document is required" });
    }

    const images = req.files.images || [];
    const documents = req.files.documents || [];

    if (images.length === 0) {
      return res.status(400).json({ error: "At least one image of the property is required" });
    }

    const uploadedDocuments = documents.map(doc => doc.path);
    console.log("Uploaded documents:", JSON.stringify(uploadedDocuments, null, 2));

    const uploadedImages = images.map(image => image.path);
    console.log("Uploaded images:", JSON.stringify(uploadedImages, null, 2));

    const geoData = await opencage.geocode({ q: req.body.address, key: OPENCAGE_API_KEY });
    if (!geoData.results || geoData.results.length === 0) {
      return res.status(400).json({ error: "Invalid address, unable to retrieve geolocation" });
    }
    const { lat, lng } = geoData.results[0].geometry;

    const newProperty = new Property({
      title: req.body.title,
      price: req.body.price,
      seller: req.params.sellerId,
      address: req.body.address,
      description: req.body.description || "",
      location: { type: "Point", coordinates: [lng, lat] },
      images: uploadedImages,
      documents: uploadedDocuments,
    });

    await newProperty.save();

    // Send a notification to the seller
    await createNotification(req.params.sellerId, `Your property "${req.body.title}" has been listed successfully!`, "success");

    return res.status(201).json({
      success: true,
      message: "Property created successfully",
      data: newProperty,
    });

  } catch (error) {
    console.error("Error creating property:", error);
    const errorMessage = error.message || JSON.stringify(error);
    console.log("Error details:", errorMessage);

    return res.status(500).json({
      error: errorMessage,
    });
  }
};




exports.decryptDocument = async (req, res) => {
  try {
    const { documentId, secretKey } = req.body; // The document ID and secret key to decrypt the document

    const property = await Property.findById(documentId);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    const document = property.documents[0]; // Assuming you're accessing the first document
    const { encryptedFilePath, iv } = document; // Get encrypted file path and IV

    // Decrypt the document
    const decryptedFilePath = await decryptDocument(encryptedFilePath, secretKey, iv);

    // Send back the decrypted file path for download
    res.download(decryptedFilePath, (err) => {
      if (err) {
        res.status(500).json({ error: "Failed to download the decrypted document" });
      }
    });
  } catch (error) {
    console.error("Error decrypting document:", error);
    res.status(500).json({ error: "An error occurred while decrypting the document" });
  }
};

  
  

exports.getAllProperties = async (req, res) => {
  try {
    const properties = await Property.find().populate("seller", "fullname email");
    res.status(200).json(properties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchProperties = async (req, res) => {
    try {
      const { address } = req.query;
  
      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }
  
      // Use OpenCage to convert the address to latitude and longitude
      const geoData = await opencage.geocode({ q: address, key: OPENCAGE_API_KEY });
  
      if (!geoData.results || geoData.results.length === 0) {
        return res.status(404).json({ error: "Location not found" });
      }
  
      const { lat, lng } = geoData.results[0].geometry;
  
      // Use MongoDB geospatial query to find properties near the location
      const properties = await Property.find({
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: [lng, lat] },
            $maxDistance: 10000, // 10 km radius
          },
        },
      });
  
      if (properties.length === 0) {
        return res.status(404).json({ message: "No properties found near this address" });
      }
  
      return res.json(properties);
    } catch (error) {
      console.error("Error searching properties:", error);
      return res.status(500).json({ error: "An unexpected error occurred" });
    }
  };
  


