const mongoose = require("mongoose");

const LawyerSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String, unique: true, required: true }, // Added phone number
  password: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  createdAt: { type: Date, default: Date.now },
});

const Lawyer = mongoose.model("Lawyer", LawyerSchema);

module.exports = Lawyer;
