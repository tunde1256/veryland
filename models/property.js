const mongoose = require("mongoose");

const PropertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    price: { type: Number, required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    address: { type: String, required: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    documents: [{ type: String }],

    location: {
      type: { type: String, enum: ["Point"], required: true, default: "Point" },
      coordinates: { type: [Number], required: true },
    },
    propertyType: {
      type: String,
      enum: ["land", "house", "apartment", "commercial", "industrial"],
      required: true,
    },
    size: {
      value: Number,
      unit: {
        type: String,
        enum: ["sqm", "sqft", "acres", "hectares"],
        default: "sqm",
      },
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    documents: [
      {
        name: String,
        url: String,
        type: {
          type: String,
          enum: ["deed", "survey", "coo", "building_plan", "other"],
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    images: [
      {
        url: String,
        caption: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    verification: {
      status: {
        type: String,
        enum: ["pending", "in_progress", "verified", "rejected"],
        default: "pending",
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      verifiedAt: Date,
      report: {
        findings: String,
        recommendations: String,
        riskLevel: {
          type: String,
          enum: ["low", "medium", "high"],
        },
      },
    },
    verificationFee: {
      percentage: {
        type: Number,
        default: 0.5, // 0.5% of property value
      },
      amount: Number,
      paid: {
        type: Boolean,
        default: false,
      },
    },
    status: {
      type: String,
      enum: ["draft", "listed", "verification_requested", "verified", "sold"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  }
);
PropertySchema.index({ location: "2dsphere" });

// Calculate verification fee before saving
propertySchema.pre("save", function (next) {
  if (
    this.isModified("price") ||
    this.isModified("verificationFee.percentage")
  ) {
    this.verificationFee.amount =
      (this.price * this.verificationFee.percentage) / 100;
  }
  next();
});

module.exports = mongoose.model("Property", PropertySchema);
