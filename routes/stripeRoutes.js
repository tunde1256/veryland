const express = require('express');
const router = express.Router();
const stripeController = require('../controller/stripeController');
const webhookController = require('../controller/webhookController');

// Route to create PaymentIntent
router.post('/create-payment-intent', stripeController.createPaymentIntent);

// Route to complete payment (confirm the Payment Intent)
router.post('/complete-payment/:paymentId', stripeController.completePayment);

// Webhook endpoint for Stripe events (payment confirmation)
router.post('/webhook', express.raw({ type: 'application/json' }), webhookController.handleStripeWebhook);

module.exports = router;
