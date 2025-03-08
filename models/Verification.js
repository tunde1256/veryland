const mongoose = require("mongoose");

const VerificationSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Buyer/Admin
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin who verifies
    remarks: { type: String }, // Optional comments from admin
  },
  { timestamps: true }
);

module.exports = mongoose.model("Verification", VerificationSchema);
