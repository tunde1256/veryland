const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/payment');  // Import the Payment model

// Conversion rate (Naira to USD) - Replace with accurate API for real-time rates
const NAIRA_TO_USD = 0.0024;  // Example: 1 NGN = 0.0024 USD (make sure to use real-time conversion)

// Create PaymentIntent for Naira payments
const createPaymentIntent = async (req, res) => {
    try {
        const { amount, userId } = req.body;  // amount in kobo (e.g., 5000 = 50 Naira)

        // Convert the amount from kobo to Naira (divide by 100)
        const amountInNaira = amount / 100;

        // Convert Naira to USD (multiply by exchange rate)
        const amountInUSD = Math.round(amountInNaira * NAIRA_TO_USD * 100); // Convert to cents (USD)

        // Ensure the amount is at least 50 cents (Stripe's minimum)
        if (amountInUSD < 50) {
            return res.status(400).send({
                error: 'Amount must be at least 50 cents in USD.',
            });
        }

        // Create the payment intent with Stripe (in USD)
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInUSD,  // Amount in cents (USD)
            currency: 'usd',      // Stripe supports USD for now
        });

        // Create a payment record in MongoDB
        const paymentRecord = new Payment({
            user_id: userId,  // Store the reference to the user
            amount: amount,  // Amount in kobo
            payment_status: 'pending',  // Set status to pending until payment is confirmed
            stripe_payment_intent_id: paymentIntent.id,  // Stripe's payment intent ID
        });

        // Save the payment record in MongoDB
        const savedPayment = await paymentRecord.save();

        // Send client secret and paymentId to the frontend
        res.status(200).send({
            clientSecret: paymentIntent.client_secret,
            paymentId: savedPayment._id,  // Return MongoDB's document ID
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).send({
            error: 'Internal Server Error',
            message: error.message,
        });
    }
};

// Complete Payment: Confirm the Payment Intent and Update Payment Status in DB
const completePayment = async (req, res) => {
    try {
        const { paymentId } = req.params;  // The paymentId passed from the frontend (MongoDB ID)
        const { paymentIntentId } = req.body;  // The payment intent ID sent from the frontend

        // Log the received payment intent ID for debugging
        console.log(`Received paymentIntentId: ${paymentIntentId} for paymentId: ${paymentId}`);

        // Find the payment record in MongoDB by its ID
        const paymentRecord = await Payment.findById(paymentId);

        if (!paymentRecord) {
            return res.status(404).send({
                error: 'Payment record not found.',
            });
        }

        // Retrieve the payment intent status from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        // Log the status of the paymentIntent for debugging
        console.log(`PaymentIntent status: ${paymentIntent.status}`);

        // Update the payment status based on the payment intent status
        if (paymentIntent.status === 'succeeded') {
            paymentRecord.payment_status = 'completed';
        } else if (paymentIntent.status === 'failed') {
            paymentRecord.payment_status = 'failed';
        } else {
            paymentRecord.payment_status = 'pending'; // Still pending, we could retry or keep the status
        }

        // Save the updated payment record in MongoDB
        await paymentRecord.save();

        // Send response back to the frontend
        res.status(200).send({
            message: 'Payment status updated successfully.',
            paymentStatus: paymentRecord.payment_status,
        });
    } catch (error) {
        console.error('Error completing payment:', error);
        res.status(500).send({
            error: 'Internal Server Error',
            message: error.message,
        });
    }
};

module.exports = {
    createPaymentIntent,
    completePayment,
};
