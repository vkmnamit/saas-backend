const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true }));

// Initialize Razorpay instance
// ⚠️ IMPORTANT: Replace these with your actual Razorpay credentials
// Get them from: https://dashboard.razorpay.com/app/website-app-settings/api-keys
const razorpay = new Razorpay({
    key_id: 'rzp_test_RSy5sbSpCkYCqq', // Replace with your Razorpay Key ID
    key_secret: 'pxRXpXW2EVZzn6Egp40KHyvn', // Replace with your Razorpay Secret
});

// Create Order - Called before payment
app.post('/api/payment/create-order', async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt } = req.body;

        if (!amount) {
            return res.status(400).json({
                success: false,
                message: 'Amount is required'
            });
        }

        const options = {
            amount: amount * 100, // Amount in paise (1 INR = 100 paise)
            currency: currency,
            receipt: receipt || `receipt_${Date.now()}`,
            payment_capture: 1 // Auto capture payment
        };

        const order = await razorpay.orders.create(options);

        res.json({
            success: true,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt
            }
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: error.message
        });
    }
});

// Verify Payment - Called after payment completion
app.post('/api/payment/verify', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Missing payment verification data'
            });
        }

        // Verify signature
        const sign = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac('sha256', 'pxRXpXW2EVZzn6Egp40KHyvn')
            .update(sign.toString())
            .digest('hex');

        if (razorpay_signature === expectedSign) {
            // Payment is verified
            // Here you can update your database with payment details
            res.json({
                success: true,
                message: 'Payment verified successfully',
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid payment signature'
            });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({
            success: false,
            message: 'Payment verification failed',
            error: error.message
        });
    }
});

// Get Payment Details
app.get('/api/payment/:paymentId', async (req, res) => {
    try {
        const { paymentId } = req.params;
        const payment = await razorpay.payments.fetch(paymentId);

        res.json({
            success: true,
            payment: payment
        });
    } catch (error) {
        console.error('Error fetching payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment details',
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Razorpay Payment Server is running' });
});

// Start the server
const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
    console.log(`✅ Razorpay Payment Server running on http://localhost:${PORT}`);
    console.log(`⚠️  Remember to update Razorpay credentials in the code!`);
});