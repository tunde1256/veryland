const bcrypt = require("bcryptjs");
const Lawyer = require("../models/lawyer");
const User = require("../models/user");
const Admin = require("../models/admin");


exports.adminResgister = async (req, res) => {
  try{
    const { fullname, email, password, phone } = req.body;
    const existingAdmin = await Admin.find
    ({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({
      fullname,
      email,
      password: hashedPassword,
      phone,
    });
    await newAdmin.save();

  }catch (error) {
    res.status(500).json({ message: error.message });
  }
}
exports.adminlogin=async (req, res)=>{
  try{
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign({ adminId: admin._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({ token, admin });

  }
  catch(error){
    res.status(500).json({ message: error.message });
  }

}
exports.createLawyerRequest = async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    if (!fullname || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingLawyer = await Lawyer.findOne({ email });
    if (existingLawyer) {
      return res.status(400).json({ message: "Lawyer request already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newLawyerRequest = new Lawyer({
      fullname,
      email,
      password: hashedPassword,
      status: 'pending',
    });

    await newLawyerRequest.save();
    res.status(201).json({ message: "Lawyer request created successfully", lawyer: newLawyerRequest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveOrRejectLawyer = async (req, res) => {
  try {
    const { lawyerId, action } = req.body; 

    const lawyer = await Lawyer.findById(lawyerId);
    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer request not found" });
    }

    if (action === 'approve') {
      lawyer.status = 'approved';

      const newUser = new User({
        fullname: lawyer.fullname,
        email: lawyer.email,
        password: lawyer.password,
        role: 'lawyer', 
      });

      await newUser.save();
    } else {
      lawyer.status = 'rejected';
    }

    await lawyer.save();
    res.status(200).json({ message: `Lawyer request ${action}d successfully`, lawyer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const axios = require("axios");

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
