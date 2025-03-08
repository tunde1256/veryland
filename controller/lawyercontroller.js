const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Lawyer = require("../models/lawyer");
const Property = require("../models/property");
const Verification = require("../models/Verification");
const nodemailer = require("nodemailer");

exports.registerLawyer = async (req, res) => {
    const { fullname, email, password, phone } = req.body;
  
    try {
      const existingLawyer = await Lawyer.findOne({ email });
      if (existingLawyer) {
        return res.status(400).json({ message: "Lawyer already registered" });
      }
  
      // Hash password before saving
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create new lawyer with status 'pending'
      const newLawyer = new Lawyer({
        fullname,
        email,
        password: hashedPassword,  
        phone,
      });
  
      await newLawyer.save();
  
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER, // Email user (e.g., from .env)
          pass: process.env.EMAIL_PASS, // Email password (from .env)
        },
      });
  
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: newLawyer.email,
        subject: 'Lawyer Registration Pending Approval',
        text: `Dear ${newLawyer.fullname},\n\nYour registration is currently pending approval by the admin. You will be notified once your account is approved.\n\nThank you.`,
      };
       
  
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error("Error sending email:", err);
        } else {
          console.log("Email sent:", info.response);
        }
      });
  
      // Return success response
      res.status(201).json({
        newLawyer,
     message: "Lawyer registered successfully. Pending approval." });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
exports.loginLawyer = async (req, res) => {
  const { email, password } = req.body;

  try {
    const lawyer = await Lawyer.findOne({ email });
    if (!lawyer || lawyer.status !== 'approved') {
      return res.status(400).json({ message: "Invalid credentials or not approved yet" });
    }

    const isMatch = await bcrypt.compare(password, lawyer.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: lawyer._id, role: 'lawyer' }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({ token, lawyer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lawyer downloads document
exports.downloadDocument = async (req, res) => {
    try {
      const { propertyId, documentIndex } = req.params;
      
      // Get the authenticated user's role
      const userRole = req.user.role; // This should be available from JWT
  
      // Check if the user is a lawyer or admin
      if (!["admin", "lawyer"].includes(userRole)) {
        return res.status(403).json({ message: "You do not have permission to download this document" });
      }
  
      // Find the property by ID
      const property = await Property.findById(propertyId);
      if (!property || !property.documents[documentIndex]) {
        return res.status(404).json({ message: "Document not found" });
      }
  
      // Redirect to the document URL for download
      res.redirect(property.documents[documentIndex]);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  

exports.giveConsent = async (req, res) => {
  const { propertyId, decision } = req.body; 

  try {
    const verification = await Verification.findOne({ property: propertyId });
    if (!verification) {
      return res.status(404).json({ message: "Verification request not found" });
    }

    verification.status = decision === "approve" ? "approved" : "rejected";
    verification.verifiedBy = req.user.id;  // Assuming user is attached to JWT
    await verification.save();

    res.status(200).json({ message: `Verification ${decision}d`, verification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getPendingVerificationRequests = async (req, res) => {
  try {
    const lawyerId = req.user.id; // Get logged-in lawyer's ID from JWT (via authMiddleware)

    // Fetch all pending verification requests
    const pendingVerifications = await Verification.find({ status: "pending" })
      .populate('property') // Populate property details
      .populate('requestedBy', 'fullname email'); // Populate requestedBy (user who requested the verification)

    if (!pendingVerifications || pendingVerifications.length === 0) {
      return res.status(404).json({ message: "No pending verification requests found." });
    }

    // Return the pending verification requests
    return res.status(200).json({ pendingVerifications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

