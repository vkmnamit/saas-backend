const crypto = require('crypto');

console.log('\n🧪 Razorpay Payment Test - Complete Flow\n');
console.log('==========================================\n');

// Step 1: Simulate Order Creation Response
const orderData = {
    id: 'order_RTP1WgmbvQsycs',
    amount: 50000, // ₹500 in paise
    currency: 'INR',
    receipt: 'test_receipt_001'
};

console.log('✅ Step 1: Order Created');
console.log('Order ID:', orderData.id);
console.log('Amount: ₹', orderData.amount / 100);
console.log('Currency:', orderData.currency);
console.log('');

// Step 2: Simulate Payment Response from Razorpay
// In real scenario, these come from Razorpay after user completes payment
const paymentResponse = {
    razorpay_order_id: orderData.id,
    razorpay_payment_id: 'pay_RTP1abc123xyz', // This would be actual payment ID from Razorpay
    razorpay_signature: '' // Will be generated below
};

console.log('✅ Step 2: Payment Completed (Simulated)');
console.log('Payment ID:', paymentResponse.razorpay_payment_id);
console.log('');

// Step 3: Generate Signature (This is what Razorpay does)
const secret = 'pxRXpXW2EVZzn6Egp40KHyvn';
const text = paymentResponse.razorpay_order_id + '|' + paymentResponse.razorpay_payment_id;
const signature = crypto.createHmac('sha256', secret).update(text).digest('hex');
paymentResponse.razorpay_signature = signature;

console.log('✅ Step 3: Signature Generated');
console.log('Signature String:', text);
console.log('Generated Signature:', signature);
console.log('');

// Step 4: Verify Signature (This is what backend does)
const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(text)
    .digest('hex');

const isValid = signature === expectedSignature;

console.log('✅ Step 4: Verify Signature');
console.log('Expected:', expectedSignature);
console.log('Received:', signature);
console.log('Match:', isValid ? '✅ YES' : '❌ NO');
console.log('');

console.log('==========================================');
console.log('📊 Test Result');
console.log('==========================================');
console.log('Payment Verification:', isValid ? '✅ SUCCESS' : '❌ FAILED');
console.log('');
console.log('💡 Complete Payment Object for API:');
console.log(JSON.stringify({
    razorpay_order_id: paymentResponse.razorpay_order_id,
    razorpay_payment_id: paymentResponse.razorpay_payment_id,
    razorpay_signature: paymentResponse.razorpay_signature
}, null, 2));
console.log('');

// Test the actual API endpoint
console.log('🚀 Testing Actual API Endpoint...\n');

const http = require('http');
const postData = JSON.stringify({
    razorpay_order_id: paymentResponse.razorpay_order_id,
    razorpay_payment_id: paymentResponse.razorpay_payment_id,
    razorpay_signature: paymentResponse.razorpay_signature
});

const options = {
    hostname: 'localhost',
    port: 5003,
    path: '/api/payment/verify',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('API Response:', data);
        console.log('');
        console.log('✅ Payment Gateway Test Complete!');
        console.log('');
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(postData);
req.end();
