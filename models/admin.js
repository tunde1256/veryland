const mongoose = require("mongoose");


const adminSchema = new mongoose.Schema(
    {
        fullname: { type: String },
        email: { type: String, unique: true, required: true },
        password: { type: String },
        role: { type: String, enum: [ "admin"], default: "admin" },
        phone: { type: String, unique: true, sparse: true }, 
        address: { type: String },
        resetPasswordToken: String,
        resetPasswordExpires: Date,
    },
    { timestamps: true }
)