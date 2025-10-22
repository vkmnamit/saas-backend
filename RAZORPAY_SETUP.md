# Razorpay Payment Gateway Setup Guide

## 🚀 Complete Setup Instructions

### Step 1: Get Razorpay Credentials

1. **Sign up/Login** to Razorpay Dashboard:
   - Go to: https://dashboard.razorpay.com/
   - Create a new account or login

2. **Get API Keys**:
   - Navigate to: Settings → API Keys
   - Or direct link: https://dashboard.razorpay.com/app/website-app-settings/api-keys
   - Click "Generate Test Key" (for development)
   - You'll receive:
     - `Key ID` (starts with `rzp_test_`)
     - `Key Secret` (keep this secret!)

### Step 2: Update Backend Configuration

1. **Update `razorpayIntegration.js`** (Line 15-16):
   ```javascript
   const razorpay = new Razorpay({
       key_id: 'rzp_test_YOUR_ACTUAL_KEY_ID',      // Replace this
       key_secret: 'YOUR_ACTUAL_KEY_SECRET'         // Replace this
   });
   ```

2. **Update verification endpoint** (Line 67):
   ```javascript
   .createHmac('sha256', 'YOUR_ACTUAL_KEY_SECRET')  // Replace this
   ```

### Step 3: Update Frontend Configuration

1. **Update `PaymentGateway.jsx`** (Line 73):
   ```javascript
   const options = {
       key: 'rzp_test_YOUR_ACTUAL_KEY_ID',  // Replace this
   ```

### Step 4: Start the Servers

1. **Terminal 1 - Start Razorpay Payment Server**:
   ```bash
   cd "/Users/namitraj/Desktop/saas full stack"
   node razorpayIntegration.js
   ```
   Should show: ✅ Razorpay Payment Server running on http://localhost:5003

2. **Terminal 2 - Start Main Backend** (if not running):
   ```bash
   cd "/Users/namitraj/Desktop/saas full stack"
   npm start
   ```

3. **Terminal 3 - Start Frontend** (if not running):
   ```bash
   cd "/Users/namitraj/Desktop/saas full stack/my-app"
   npm run dev
   ```

### Step 5: Test Payment Gateway

1. **Access the Payment Gateway**:
   - Open: http://localhost:5173/payment-gateway
   - Or add route in your app

2. **Test Payment Flow**:
   - Enter amount (e.g., 500 for ₹500)
   - Click "Pay ₹500"
   - Razorpay checkout modal will open
   
3. **Use Test Card Details**:
   - **Card Number**: 4111 1111 1111 1111
   - **Expiry**: Any future date (e.g., 12/25)
   - **CVV**: Any 3 digits (e.g., 123)
   - **Name**: Any name
   - **Email**: Any email
   - **Contact**: Any 10-digit number

4. **Complete Payment**:
   - Click "Pay Now"
   - You should see "Payment Successful! 🎉"

## 📝 API Endpoints

### 1. Create Order
```
POST http://localhost:5003/api/payment/create-order
Content-Type: application/json

{
  "amount": 500,
  "currency": "INR",
  "receipt": "receipt_12345"
}
```

### 2. Verify Payment
```
POST http://localhost:5003/api/payment/verify
Content-Type: application/json

{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}
```

### 3. Get Payment Details
```
GET http://localhost:5003/api/payment/{paymentId}
```

### 4. Health Check
```
GET http://localhost:5003/health
```

## 🔧 Integration with Your App

### Add Route to App.jsx

```javascript
import PaymentGateway from './assets/PaymentGateway';

// In your routes:
<Route path="/payment-gateway" element={<PaymentGateway />} />
```

### Add Navigation Link

```javascript
<Link to="/payment-gateway">Make Payment</Link>
```

### Integration with Cart/Checkout

In your Cart.jsx or checkout component:

```javascript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

const handleCheckout = async () => {
    // Calculate total amount
    const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    // Navigate to payment gateway with amount
    navigate('/payment-gateway', { state: { amount: totalAmount } });
};
```

Then in PaymentGateway.jsx:

```javascript
import { useLocation } from 'react-router-dom';

const location = useLocation();
const [amount, setAmount] = useState(location.state?.amount || 500);
```

## 🔐 Security Best Practices

1. **Never expose Key Secret** on frontend
2. **Always verify** payment signature on backend
3. **Use environment variables** for production:
   ```javascript
   key_id: process.env.RAZORPAY_KEY_ID
   key_secret: process.env.RAZORPAY_KEY_SECRET
   ```
4. **Enable webhooks** for payment notifications
5. **Store payment records** in your database

## 💾 Database Integration (Optional)

Add payment records to your database after successful verification:

```javascript
// In verify endpoint, after signature verification
const payment = {
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    amount: amount,
    status: 'success',
    userId: userId, // from auth token
    timestamp: new Date()
};

await PaymentModel.create(payment);
```

## 🐛 Troubleshooting

### "Failed to load Razorpay SDK"
- Check internet connection
- Ensure `https://checkout.razorpay.com/v1/checkout.js` is accessible

### "Invalid Key ID"
- Verify you copied the complete Key ID (starts with `rzp_test_`)
- Check for extra spaces or quotes

### "Payment verification failed"
- Ensure Key Secret matches in both places (line 16 and line 67)
- Check signature generation logic

### CORS Issues
- Razorpay payment server runs on port 5003
- Ensure CORS allows localhost:5173 and localhost:5174

## 🎯 Next Steps

1. ✅ Replace dummy credentials with real Razorpay keys
2. ✅ Test payment flow end-to-end
3. ✅ Integrate with your cart/checkout
4. ✅ Add payment success/failure pages
5. ✅ Store payment records in database
6. ✅ Set up Razorpay webhooks for payment notifications
7. ✅ Move to production keys when going live

## 📚 Razorpay Documentation

- Dashboard: https://dashboard.razorpay.com/
- API Docs: https://razorpay.com/docs/api/
- Test Cards: https://razorpay.com/docs/payments/payments/test-card-details/

## ✨ Features Implemented

- ✅ Complete payment flow
- ✅ Order creation
- ✅ Payment verification with signature
- ✅ Error handling
- ✅ Loading states
- ✅ Beautiful UI with animations
- ✅ Test card information
- ✅ Mobile responsive
- ✅ Payment status feedback

---

**Need Help?** Check Razorpay documentation or contact their support team.
