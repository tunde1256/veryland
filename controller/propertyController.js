const Property = require("../models/property");
const opencage = require("opencage-api-client");

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
      // Validate that both images and documents are uploaded
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "At least one image or document is required" });
      }
  
      // Extract the seller from the URL params
      const { seller } = req.params;
  
      // Extract the other fields from the request body
      const { title, address, price, description } = req.body;
  
      // Validate that all required fields are present
      if (!title || !address || !price || !seller) {
        return res.status(400).json({ error: "All fields (title, address, price, seller) are required" });
      }
  
      // Separate images and documents from req.files (cloudinary will store both types)
      const images = req.files.filter((file) => file.mimetype.startsWith("image"));
      const documents = req.files.filter((file) => file.mimetype === "application/pdf" || file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.mimetype === "text/plain");
  
      // Ensure that at least one image is uploaded
      if (images.length === 0) {
        return res.status(400).json({ error: "At least one image of the property is required" });
      }
  
      // Collect the image URLs and document URLs
      const imageUrls = images.map((file) => file.path);
      const documentUrls = documents.map((file) => file.path);
  
      // Use OpenCage API to get geo-coordinates from the address
      const geoData = await opencage.geocode({ q: address, key: OPENCAGE_API_KEY });
  
      if (!geoData.results || geoData.results.length === 0) {
        return res.status(400).json({ error: "Invalid address, unable to retrieve geolocation" });
      }
  
      const { lat, lng } = geoData.results[0].geometry;
  
      // Create the property document in the database
      const newProperty = new Property({
        title,
        price,
        seller,
        address,
        description: description || "", // Optional description
        location: {
          type: "Point",
          coordinates: [lng, lat], // MongoDB GeoJSON format
        },
        images: imageUrls, // Save image URLs
        documents: documentUrls, // Save document URLs
      });
  
      await newProperty.save();
  
      return res.status(201).json({
        success: true,
        message: "Property created successfully",
        data: newProperty,
      });
    } catch (error) {
      console.error("Error creating property:", error);
  
      // Handle errors
      if (error.name === "ValidationError") {
        return res.status(400).json({ error: error.message });
      }
  
      return res.status(500).json({ error: "An unexpected error occurred. Please try again later." });
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
  


