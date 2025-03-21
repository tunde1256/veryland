const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/payment'); // Import the Payment model

// Webhook handler to update payment status
const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        // Construct the event from the Stripe signature and body
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return res.status(400).send(`Webhook error: ${err.message}`);
    }

    // Handle the event types you're interested in
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object; // Extract payment intent from the event
            // Update the payment status to 'succeeded' in MongoDB
            await Payment.updateOne(
                { stripe_payment_intent_id: paymentIntent.id },
                { $set: { payment_status: 'succeeded' } }
            );
            console.log('PaymentIntent succeeded:', paymentIntent.id);
            break;
        case 'payment_intent.payment_failed':
            const failedPaymentIntent = event.data.object; // Extract failed payment intent
            // Update the payment status to 'failed'
            await Payment.updateOne(
                { stripe_payment_intent_id: failedPaymentIntent.id },
                { $set: { payment_status: 'failed' } }
            );
            console.log('PaymentIntent failed:', failedPaymentIntent.id);
            break;
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    // Acknowledge receipt of the event
    res.status(200).send('Event received');
};

module.exports = {
    handleStripeWebhook,
};
