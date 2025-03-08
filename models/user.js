const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["buyer", "seller", "admin"], default: "buyer" },
    phone: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    isVerified: { type: Boolean, default: false }, 
    resetPasswordToken: String,  
    resetPasswordExpires: Date, 
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
