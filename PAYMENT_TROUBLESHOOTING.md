# 🔍 Payment Failure Troubleshooting Guide

## Common Reasons for Payment Failure

### 1. **Razorpay Server Not Running** ❌
**Check:** Is the payment server running on port 5003?
```bash
curl http://localhost:5003/health
```
**Expected:** `{"status":"OK","message":"Razorpay Payment Server is running"}`

**Solution:** Start the server
```bash
cd "/Users/namitraj/Desktop/saas full stack"
node razorpayIntegration.js &
```

---

### 2. **Invalid Razorpay Credentials** 🔑
**Problem:** Using wrong Key ID or Secret

**Check in PaymentGateway.jsx (Line 68):**
```javascript
key: 'rzp_test_RSy5sbSpCkYCqq'
```

**Check in razorpayIntegration.js (Lines 15-17):**
```javascript
key_id: 'rzp_test_RSy5sbSpCkYCqq'
key_secret: 'pxRXpXW2EVZzn6Egp40KHyvn'
```

**Solution:** 
- Login to https://dashboard.razorpay.com/
- Go to Settings → API Keys
- Verify your keys match exactly

---

### 3. **Network/CORS Issues** 🌐
**Problem:** Browser blocking requests to localhost:5003

**Check Browser Console for:**
- CORS errors
- Network errors
- Failed fetch requests

**Solution:** CORS is already configured in razorpayIntegration.js

---

### 4. **Test Card Issues** 💳
**Problem:** Using wrong test card or real card in test mode

**Use ONLY these test cards:**
```
Card Number: 4111 1111 1111 1111
Expiry: 12/25 (any future date)
CVV: 123 (any 3 digits)
Name: Test User
```

**DON'T:**
- Use real card numbers in test mode
- Use invalid card formats

---

### 5. **Amount Issues** 💰
**Problem:** Invalid amount (0, negative, or too large)

**Valid amounts:**
- Minimum: ₹1
- Maximum: No limit in test mode
- Format: Integer (e.g., 100, 500, 1000)

---

### 6. **Razorpay Modal Not Opening** 🪟
**Problem:** Razorpay checkout script not loaded

**Check Browser Console for:**
```
Failed to load Razorpay SDK
```

**Solution:**
- Check internet connection
- Verify https://checkout.razorpay.com/v1/checkout.js is accessible
- Reload the page

---

### 7. **Payment Verification Failing** ✅
**Problem:** Signature mismatch during verification

**Check:**
- Key secret in razorpayIntegration.js line 76
- Should be: `'pxRXpXW2EVZzn6Egp40KHyvn'`

**Test verification endpoint:**
```bash
curl -X POST http://localhost:5003/api/payment/verify \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "order_test",
    "razorpay_payment_id": "pay_test",
    "razorpay_signature": "test_signature"
  }'
```

---

## Step-by-Step Payment Test

### Step 1: Start Razorpay Server
```bash
# Check if already running
lsof -ti:5003

# If not running, start it
cd "/Users/namitraj/Desktop/saas full stack"
node razorpayIntegration.js &

# Verify it's running
curl http://localhost:5003/health
```

### Step 2: Start Frontend
```bash
cd "/Users/namitraj/Desktop/saas full stack/my-app"
npm run dev
```

### Step 3: Open Payment Page
```
http://localhost:5173/payment
```

### Step 4: Complete Payment Flow
1. **Enter amount:** 100 (for ₹100)
2. **Click:** "Pay ₹100"
3. **Wait for:** Razorpay modal to open
4. **Fill test card:**
   - Card: 4111 1111 1111 1111
   - Expiry: 12/25
   - CVV: 123
   - Name: Test User
5. **Click:** "Pay Now"
6. **See:** Success message ✅

---

## Debugging Commands

### Check if server is running
```bash
lsof -ti:5003
```

### Test order creation
```bash
curl -X POST http://localhost:5003/api/payment/create-order \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "INR", "receipt": "test"}'
```

### View server logs
```bash
# If running in foreground, check terminal output
# If running in background, check with:
ps aux | grep razorpay
```

### Kill and restart server
```bash
pkill -f "node razorpayIntegration.js"
cd "/Users/namitraj/Desktop/saas full stack"
node razorpayIntegration.js
```

---

## Browser Console Debugging

### Open Browser Console:
- Chrome/Edge: `F12` or `Cmd+Option+I` (Mac)
- Check "Console" tab

### Look for these errors:

**1. Order Creation Failed:**
```
POST http://localhost:5003/api/payment/create-order 500
```
**Solution:** Check razorpay credentials

**2. CORS Error:**
```
Access to fetch at 'http://localhost:5003' has been blocked by CORS
```
**Solution:** Server already has CORS enabled, restart server

**3. Razorpay is not defined:**
```
ReferenceError: Razorpay is not defined
```
**Solution:** Check internet connection, script not loaded

**4. Payment verification failed:**
```
Payment verification failed!
```
**Solution:** Check key_secret in razorpayIntegration.js line 76

---

## Quick Test Script

Run this to test everything at once:
```bash
#!/bin/bash
echo "🧪 Testing Razorpay Payment Gateway..."

# Test 1: Server Health
echo "1️⃣ Testing server health..."
HEALTH=$(curl -s http://localhost:5003/health)
if [[ $HEALTH == *"OK"* ]]; then
    echo "✅ Server is running"
else
    echo "❌ Server is NOT running"
    echo "Starting server..."
    cd "/Users/namitraj/Desktop/saas full stack"
    node razorpayIntegration.js &
    sleep 2
fi

# Test 2: Order Creation
echo "2️⃣ Testing order creation..."
ORDER=$(curl -s -X POST http://localhost:5003/api/payment/create-order \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "INR", "receipt": "test"}')
if [[ $ORDER == *"success"* ]]; then
    echo "✅ Order creation working"
else
    echo "❌ Order creation failed"
fi

echo ""
echo "📋 Summary:"
echo "- Server: http://localhost:5003"
echo "- Frontend: http://localhost:5173/payment"
echo "- Test Card: 4111 1111 1111 1111"
echo ""
```

Save as `test-payment-debug.sh` and run:
```bash
bash test-payment-debug.sh
```

---

## What to Share if Still Failing

If payment is still failing, share:
1. Browser console error messages (screenshot)
2. Network tab showing failed requests
3. Output of: `curl http://localhost:5003/health`
4. Output of: `lsof -ti:5003`
5. Any error messages in terminal where server is running

---

## Most Common Fix ⚡

**90% of payment failures are due to server not running!**

```bash
# Quick fix:
cd "/Users/namitraj/Desktop/saas full stack"
pkill -f "node razorpayIntegration.js"
node razorpayIntegration.js &
sleep 2
curl http://localhost:5003/health
```

Then try payment again in browser!
