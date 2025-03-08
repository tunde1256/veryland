const Verification = require("../models/Verification");
const Property = require("../models/property");

// Request verification
exports.requestVerification = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id; // Get user from JWT auth middleware

    // Ensure property exists
    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ error: "Property not found" });

    // Check if verification is already requested
    const existingRequest = await Verification.findOne({ property: propertyId });
    if (existingRequest) return res.status(400).json({ error: "Verification already requested" });

    // Create verification request
    const verification = new Verification({
      property: propertyId,
      requestedBy: userId,
      status: "pending",
    });

    await verification.save();
    res.status(201).json({ message: "Verification requested", verification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Approve verification (Admin only)
exports.approveVerification = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const adminId = req.user.id; // Ensure only admin calls this

    // Find verification request
    const verification = await Verification.findOne({ property: propertyId });
    if (!verification) return res.status(404).json({ error: "Verification request not found" });

    // Approve the verification
    verification.status = "approved";
    verification.verifiedBy = adminId;
    await verification.save();

    await Property.findByIdAndUpdate(propertyId, { status: "verified" });

    res.status(200).json({ message: "Property verified successfully", verification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reject verification (Admin only)
exports.rejectVerification = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const adminId = req.user.id; // Ensure only admin calls this

    // Find verification request
    const verification = await Verification.findOne({ property: propertyId });
    if (!verification) return res.status(404).json({ error: "Verification request not found" });

    // Reject the verification
    verification.status = "rejected";
    verification.verifiedBy = adminId;
    await verification.save();

    await Property.findByIdAndUpdate(propertyId, { status: "rejected" });

    res.status(200).json({ message: "Property verification rejected", verification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// List all verification requests (Admin only)
exports.listVerificationRequests = async (req, res) => {
  try {
    const adminId = req.user.id; // Ensure only admin calls this

    // Find all verification requests for all properties
    const verifications = await Verification.find({ status: "pending" }).populate("property", "title address").populate("requestedBy", "fullname email");

    res.status(200).json(verifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// List all verified properties (Admin only)
exports.listVerifiedProperties = async (req, res) => {
  try {
    const adminId = req.user.id; // Ensure only admin calls this

    // Find all verified properties
    const properties = await Property.find({ status: "verified" }).populate("seller", "fullname email");

    res.status(200).json(properties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// List all rejected properties (Admin only)
exports.listRejectedProperties = async (req, res) => {
  try {
    const adminId = req.user.id; // Ensure only admin calls this

    // Find all rejected properties
    const properties = await Property.find({ status: "rejected" }).populate("seller", "fullname email");

    res.status(200).json(properties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
