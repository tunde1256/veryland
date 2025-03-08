const bcrypt = require("bcryptjs");
const Lawyer = require("../models/lawyer");
const User = require("../models/user");

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
const Lawyer = require("../models/lawyer");

exports.approveLawyer = async (req, res) => {
  const { lawyerId, decision } = req.body; // decision can be 'approve' or 'reject'

  try {
    const lawyer = await Lawyer.findById(lawyerId);
    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found" });
    }

    if (decision === 'approve') {
      lawyer.status = 'approved';
    } else if (decision === 'reject') {
      lawyer.status = 'rejected';
    } else {
      return res.status(400).json({ message: "Invalid decision" });
    }

    await lawyer.save();

    res.status(200).json({ message: `Lawyer ${decision}d successfully`, lawyer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.approveOrRejectLawyer = async (req, res) => {
  try {
    const { lawyerId, action } = req.body; // action can be 'approve' or 'reject'

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
