const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    type: { type: String, enum: ["info", "success", "warning", "error"], default: "info" },
  },
  { timestamps: true } // This will add createdAt and updatedAt timestamps
);

module.exports = mongoose.model("Notification", NotificationSchema);
