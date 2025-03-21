const mongoose = require('mongoose');

// Define a schema for payments
const paymentSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId, // Store the reference to the user who made the payment
        required: true,
        ref: 'User',  // Assuming you have a 'User' model for the user details
    },
    amount: {
        type: Number, // Amount in kobo (NGN)
        required: true,
    },
    currency: {
        type: String,
        default: 'ngn',  // Default currency is Naira (NGN)
    },
    payment_status: {
        type: String,
        enum: ['pending', 'succeeded', 'failed'], // Payment status
        default: 'pending',
    },
    stripe_payment_intent_id: {
        type: String, // Stripe payment intent ID
        required: true,
        unique: true,  // Ensure the payment intent ID is unique
    },
    created_at: {
        type: Date,
        default: Date.now, // Automatically set the creation time
    },
    updated_at: {
        type: Date,
        default: Date.now, // Automatically set the update time
    },
});

// Create the model for the Payment
const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
