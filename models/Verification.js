
// models/VerificationRequest.js
const mongoose = require("mongoose");

const verificationRequestSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "assigned", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
    scheduledDate: Date,
    completedDate: Date,
    report: {
      documentVerification: {
        status: String,
        notes: String,
      },
      physicalInspection: {
        status: String,
        notes: String,
        images: [String],
      },
      legalVerification: {
        status: String,
        notes: String,
      },
      overallRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      recommendations: String,
      riskAssessment: {
        level: {
          type: String,
          enum: ["low", "medium", "high"],
        },
        factors: [String],
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "VerificationRequest",
  // verificationRequestSchema
);