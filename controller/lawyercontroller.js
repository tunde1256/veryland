const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Lawyer = require("../models/lawyer");
const Property = require("../models/property");
const Verification = require("../models/Verification");
const nodemailer = require("nodemailer");
const { decryptDocument } = require('../utils/encryptionUtils');
const axios = require("axios");


exports.registerLawyer = async (req, res) => {
  const {
    fullname,
    email,
    password,
    phone,
    legal_office_name,
    office_contact_number,
    office_address,
    bar_association_number,
    identity_document_url,
    years_of_experience,
    area_of_specialization
  } = req.body;

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
      phone,
      password: hashedPassword,
      legal_office_name,
      office_contact_number,
      office_address,
      bar_association_number,
      identity_document_url,
      years_of_experience,
      area_of_specialization,
    });

    await newLawyer.save();

    // Email setup
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: newLawyer.email,
      subject: 'Welcome to PlotXpert - Registration Pending Approval',
      text: `Dear ${newLawyer.fullname},

Welcome to PlotXpert!

We have received your registration request, and your account is currently under review. Our admin team will verify your details, and you will receive an approval notification once your account has been activated.

What happens next?
- Your account is being reviewed to ensure compliance with our legal service policies.
- Approval typically takes 24-48 hours.
- Once approved, you will gain full access to our platform.

Need Assistance?
If you have any questions, feel free to reach out to our support team at ${process.env.SUPPORT_EMAIL}.

Thank you for joining PlotXpert!

Best regards,  
The PlotXpert Team
      `,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Error sending email:", err);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    res.status(201).json({
      newLawyer,
      message: "Lawyer registered successfully. Pending approval."
    });
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




exports.downloadDocument = async (req, res) => {
  try {
    const { propertyId, documentIndex } = req.params;
    const userRole = req.user.role; // Get role from JWT (lawyer or admin)
    
    // Check if user is allowed to download
    if (!["admin", "lawyer"].includes(userRole)) {
      return res.status(403).json({ message: "You do not have permission to download this document" });
    }

    // Find the property by ID
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Ensure the document exists at the specified index
    const document = property.documents[documentIndex];
    if (!document) {
      return res.status(404).json({ message: "Document not found at the specified index" });
    }

    console.log("Found document:", document); // Log to inspect the document object

    // Check if the document has the filePath (Cloudinary URL)
    if (!document.filePath) {
      return res.status(404).json({ message: "Document file path is missing" });
    }

    // Fetch the document from Cloudinary and stream it to the client
    const response = await axios({
      method: "get",
      url: document.filePath,  // Directly using `filePath` instead of `encryptedFilePath`
      responseType: "stream",
    });

    // Set headers to trigger file download on the client side
    res.setHeader("Content-Disposition", `attachment; filename="${document.name}"`);
    res.setHeader("Content-Type", response.headers["content-type"]); // Set content type dynamically

    // Pipe the file stream from Cloudinary to the client
    response.data.pipe(res);

  } catch (error) {
    console.error("Error downloading document:", error);
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

