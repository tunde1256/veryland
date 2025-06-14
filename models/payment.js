// // models/Payment.js
// const mongoose = require("mongoose");

// const paymentSchema = new mongoose.Schema(
//   {
//     reference: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     property: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Property",
//       required: true,
//     },
//     amount: {
//       type: Number,
//       required: true,
//     },
//     currency: {
//       type: String,
//       default: "NGN",
//     },
//     paymentMethod: {
//       type: String,
//       enum: ["card", "bank_transfer", "ussd", "qr", "mobile_money"],
//       required: true,
//     },
//     gateway: {
//       type: String,
//       enum: ["paystack", "flutterwave", "interswitch"],
//       default: "paystack",
//     },
//     gatewayReference: String,
//     status: {
//       type: String,
//       enum: [
//         "pending",
//         "processing",
//         "success",
//         "failed",
//         "cancelled",
//         "refunded",
//       ],
//       default: "pending",
//     },
//     metadata: {
//       channel: String,
//       bank: String,
//       authorization: {
//         authorization_code: String,
//         bin: String,
//         last4: String,
//         exp_month: String,
//         exp_year: String,
//         channel: String,
//         card_type: String,
//         bank: String,
//         country_code: String,
//         brand: String,
//       },
//     },
//     paidAt: Date,
//     refundedAt: Date,
//     refundReason: String,
//     fees: {
//       gateway: Number,
//       platform: Number,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// module.exports = mongoose.model("Payment", paymentSchema);

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
  verificationRequestSchema
);
