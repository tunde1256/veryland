// controllers/paymentController.js
const crypto = require("crypto");
const { validationResult } = require("express-validator");
const Payment = require("../models/payment.js");
const Property = require("../models/Property.js");
const VerificationRequest = require("../models/Verification.js");
const { paystackService } = require("../services/paymentGateway.js");
const logger = require("../utils/logger.js");

/**
 * Initialize payment for property verification
 */
const initializePayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { propertyId, paymentMethod } = req.body;
    const userId = req.user.id;

    // Find the property
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Check if verification fee is already paid
    if (property.verificationFee.paid) {
      return res
        .status(400)
        .json({ message: "Verification fee already paid for this property" });
    }

    // Generate unique payment reference
    const reference = `VL_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Create payment record
    const payment = new Payment({
      reference,
      user: userId,
      property: propertyId,
      amount: property.verificationFee.amount,
      paymentMethod,
      gateway: "paystack",
    });

    await payment.save();

    // Initialize payment with Paystack
    const paymentData = {
      email: req.user.email,
      amount: property.verificationFee.amount * 100, // Convert to kobo
      reference,
      callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
      metadata: {
        user_id: userId,
        property_id: propertyId,
        payment_type: "verification_fee",
      },
    };

    const paystackResponse = await paystackService.initializePayment(
      paymentData
    );

    if (paystackResponse.status) {
      payment.gatewayReference = paystackResponse.data.reference;
      await payment.save();

      res.status(200).json({
        message: "Payment initialized successfully",
        data: {
          authorization_url: paystackResponse.data.authorization_url,
          access_code: paystackResponse.data.access_code,
          reference: paystackResponse.data.reference,
          amount: property.verificationFee.amount,
        },
      });
    } else {
      payment.status = "failed";
      await payment.save();
      res.status(400).json({ message: "Failed to initialize payment" });
    }
  } catch (error) {
    logger.error("Payment initialization error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Paystack webhook for payment verification
 */
const paystackWebhook = async (req, res) => {
  try {
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    const event = req.body;

    if (event.event === "charge.success") {
      const { reference, status, amount, metadata, authorization } = event.data;

      const payment = await Payment.findOne({ reference }).populate(
        "property user"
      );
      if (!payment) {
        logger.error(`Payment not found for reference: ${reference}`);
        return res.status(404).json({ message: "Payment not found" });
      }

      if (status === "success") {
        payment.status = "success";
        payment.paidAt = new Date();
        payment.metadata = {
          channel: event.data.channel,
          bank: event.data.bank,
          authorization,
        };

        // Update property verification fee status
        const property = await Property.findById(payment.property._id);
        property.verificationFee.paid = true;
        property.status = "verification_requested";

        // Create verification request
        const verificationRequest = new VerificationRequest({
          property: payment.property._id,
          requestedBy: payment.user._id,
          payment: payment._id,
        });

        await Promise.all([
          payment.save(),
          property.save(),
          verificationRequest.save(),
        ]);

        // Send notification email (implement as needed)
        logger.info(`Payment successful for property ${payment.property._id}`);
      } else {
        payment.status = "failed";
        await payment.save();
      }
    }

    res.status(200).json({ message: "Webhook processed successfully" });
  } catch (error) {
    logger.error("Webhook processing error:", error);
    res.status(500).json({ message: "Webhook processing failed" });
  }
};

/**
 * Verify payment status
 */
const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    const payment = await Payment.findOne({ reference })
      .populate("property", "title price verificationFee")
      .populate("user", "firstName lastName email");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Double-check with Paystack
    const verification = await paystackService.verifyPayment(reference);

    if (verification.status && verification.data.status === "success") {
      if (payment.status !== "success") {
        payment.status = "success";
        payment.paidAt = new Date();
        await payment.save();

        // Update property status if not already updated
        const property = await Property.findById(payment.property._id);
        if (!property.verificationFee.paid) {
          property.verificationFee.paid = true;
          property.status = "verification_requested";
          await property.save();
        }
      }
    }

    res.status(200).json({
      message: "Payment verification completed",
      payment: {
        reference: payment.reference,
        amount: payment.amount,
        status: payment.status,
        paidAt: payment.paidAt,
        property: payment.property,
        user: payment.user,
      },
    });
  } catch (error) {
    logger.error("Payment verification error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get user's payment history
 */
const getPaymentHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const payments = await Payment.find({ user: req.user.id })
      .populate("property", "title address price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments({ user: req.user.id });

    res.status(200).json({
      payments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    logger.error("Payment history error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Request refund
 */
const requestRefund = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentId } = req.params;
    const { reason } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (payment.status !== "success") {
      return res
        .status(400)
        .json({ message: "Only successful payments can be refunded" });
    }

    // Check if verification is already in progress or completed
    const verificationRequest = await VerificationRequest.findOne({
      payment: paymentId,
    });
    if (
      verificationRequest &&
      ["in_progress", "completed"].includes(verificationRequest.status)
    ) {
      return res.status(400).json({
        message:
          "Cannot refund - verification is already in progress or completed",
      });
    }

    // Process refund with Paystack
    const refundData = {
      transaction: payment.gatewayReference,
      amount: payment.amount * 100, // Convert to kobo
    };

    const refundResponse = await paystackService.refundPayment(refundData);

    if (refundResponse.status) {
      payment.status = "refunded";
      payment.refundedAt = new Date();
      payment.refundReason = reason;
      await payment.save();

      // Update property status
      const property = await Property.findById(payment.property);
      property.verificationFee.paid = false;
      property.status = "listed";
      await property.save();

      res.status(200).json({
        message: "Refund processed successfully",
        refund: {
          amount: payment.amount,
          reason,
          processedAt: payment.refundedAt,
        },
      });
    } else {
      res.status(400).json({ message: "Refund processing failed" });
    }
  } catch (error) {
    logger.error("Refund processing error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  initializePayment,
  paystackWebhook,
  verifyPayment,
  getPaymentHistory,
  requestRefund,
};
