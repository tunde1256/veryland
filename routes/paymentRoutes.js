// routes/payments.js
const express = require("express");
const { body } = require("express-validator");
const { authenticate } = require("../middlewares/paymentAuth.js");

const {
  initializePayment,
  paystackWebhook,
  verifyPayment,
  getPaymentHistory,
  requestRefund,
} = require("../controllers/paymentController.js");

const router = express.Router();

// Initialize payment for property verification
router.post(
  "/initialize",
  authenticate,
  [
    body("propertyId").isMongoId().withMessage("Valid property ID is required"),
    body("paymentMethod")
      .isIn(["card", "bank_transfer", "ussd", "qr"])
      .withMessage("Valid payment method is required"),
  ],
  initializePayment
);

// Paystack webhook for payment verification
router.post("/webhook/paystack", paystackWebhook);

// Verify payment status
router.get("/verify/:reference", authenticate, verifyPayment);

// Get user's payment history
router.get("/history", authenticate, getPaymentHistory);

// Request refund
router.post(
  "/refund/:paymentId",
  authenticate,
  [body("reason").notEmpty().withMessage("Refund reason is required")],
  requestRefund
);

module.exports = router
