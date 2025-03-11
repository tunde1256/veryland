const mongoose = require("mongoose");

const PropertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    price: { type: Number, required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User",},
    address: { type: String, required: true }, 
    description: { type: String, default: "" },
    status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
    documents: [{ type: String }], 

    location: {
      type: { type: String, enum: ["Point"], required: true, default: "Point" },
      coordinates: { type: [Number], required: true }, 
    },

    images: [{ type: String }], 
  },
  { timestamps: true }
);

PropertySchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Property", PropertySchema);
