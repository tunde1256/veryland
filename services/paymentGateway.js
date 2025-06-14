// services/paymentGateway.js
const axios = require("axios");
const crypto = require("crypto");
// const logger = require("../utils/logger");

class PaystackService {
  constructor() {
    this.baseURL = "https://api.paystack.co";
    this.secretKey = process.env.PAYSTACK_SECRET_KEY;
    this.publicKey = process.env.PAYSTACK_PUBLIC_KEY;
  }

  async initializePayment(paymentData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/transaction/initialize`,
        paymentData,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      logger.error(
        "Paystack initialization error:",
        error.response?.data || error.message
      );
      throw new Error("Payment initialization failed");
    }
  }

  async verifyPayment(reference) {
    try {
      const response = await axios.get(
        `${this.baseURL}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      logger.error(
        "Paystack verification error:",
        error.response?.data || error.message
      );
      throw new Error("Payment verification failed");
    }
  }

  async refundPayment(refundData) {
    try {
      const response = await axios.post(`${this.baseURL}/refund`, refundData, {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      logger.error(
        "Paystack refund error:",
        error.response?.data || error.message
      );
      throw new Error("Refund processing failed");
    }
  }

  async listTransactions(params = {}) {
    try {
      const response = await axios.get(`${this.baseURL}/transaction`, {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
        params,
      });
      return response.data;
    } catch (error) {
      logger.error(
        "Paystack list transactions error:",
        error.response?.data || error.message
      );
      throw new Error("Failed to retrieve transactions");
    }
  }
}

module.exports = {
  paystackService: new PaystackService(),
};
