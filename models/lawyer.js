// const mongoose = require("mongoose");

// const LawyerSchema = new mongoose.Schema({
//   fullname: { type: String, required: true },
//   email: { type: String, unique: true, required: true },
//   phone: { type: String, unique: true, required: true }, // Added phone number
//   password: { type: String, required: true },
//   status: {
//     type: String,
//     enum: ['pending', 'approved', 'rejected'],
//     default: 'pending',
//   },
//   createdAt: { type: Date, default: Date.now },
// });

// const Lawyer = mongoose.model("Lawyer", LawyerSchema);

// module.exports = Lawyer;
const mongoose = require("mongoose");

const LawyerSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  legal_office_name: { type: String, required: true },
  office_contact_number: { type: String, required: true },
  office_address: { type: String, required: true },
  bar_association_number: { type: String, required: true },

  // ✅ Allow both license and ID card
  identity_documents: {
    license: { type: String, required: true },
  },

  years_of_experience: { type: String, required: true },
  area_of_specialization: { type: String, required: true },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  createdAt: { type: Date, default: Date.now },
});

const Lawyer = mongoose.model("Lawyer", LawyerSchema);

module.exports = Lawyer;
