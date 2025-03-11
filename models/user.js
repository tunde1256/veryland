const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    fullname: { type: String },
    email: { type: String, unique: true, required: true },
    password: { type: String },
    role: { type: String, enum: ["buyer", "seller", "admin", "lawyer"], default: "buyer" },
    phone: { type: String, unique: true, sparse: true },  // Ensure uniqueness but allow multiple `null` values
    address: { type: String },
    isVerified: { type: Boolean, default: false },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
