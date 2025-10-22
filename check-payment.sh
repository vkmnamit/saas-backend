#!/bin/bash

echo ""
echo "🔍 Payment Gateway Diagnostic Check"
echo "===================================="
echo ""

# Check 1: Razorpay server
echo "1️⃣ Checking Razorpay Server (Port 5003)..."
if lsof -ti:5003 > /dev/null 2>&1; then
    echo "✅ Server is running on port 5003"
    HEALTH=$(curl -s http://localhost:5003/health)
    echo "   Response: $HEALTH"
else
    echo "❌ Server is NOT running on port 5003"
    echo "   Fix: Run 'node razorpayIntegration.js &'"
fi
echo ""

# Check 2: Main backend server
echo "2️⃣ Checking Main Backend Server (Port 5002)..."
if lsof -ti:5002 > /dev/null 2>&1; then
    echo "✅ Backend server is running on port 5002"
else
    echo "❌ Backend server is NOT running on port 5002"
    echo "   Fix: Run 'npm start' in main directory"
fi
echo ""

# Check 3: Frontend dev server
echo "3️⃣ Checking Frontend Dev Server (Port 5173)..."
if lsof -ti:5173 > /dev/null 2>&1; then
    echo "✅ Frontend is running on port 5173"
else
    echo "⚠️  Frontend might not be running on port 5173"
    echo "   Fix: Run 'npm run dev' in my-app directory"
fi
echo ""

# Check 4: Test order creation
echo "4️⃣ Testing Order Creation API..."
ORDER_RESULT=$(curl -s -X POST http://localhost:5003/api/payment/create-order \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "INR", "receipt": "test"}' 2>&1)

if [[ $ORDER_RESULT == *"success"* ]]; then
    echo "✅ Order creation API working"
    ORDER_ID=$(echo $ORDER_RESULT | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "   Sample Order ID: $ORDER_ID"
else
    echo "❌ Order creation API failed"
    echo "   Response: $ORDER_RESULT"
fi
echo ""

# Summary
echo "===================================="
echo "📊 DIAGNOSTIC SUMMARY"
echo "===================================="
echo ""

ALL_OK=true
lsof -ti:5003 > /dev/null 2>&1 || ALL_OK=false
lsof -ti:5002 > /dev/null 2>&1 || ALL_OK=false
[[ $ORDER_RESULT == *"success"* ]] || ALL_OK=false

if [ "$ALL_OK" = true ]; then
    echo "✅ All systems operational!"
    echo ""
    echo "🎯 You can test payment at:"
    echo "   http://localhost:5173/payment"
    echo ""
    echo "💳 Use test card:"
    echo "   Card: 4111 1111 1111 1111"
    echo "   Expiry: 12/25"
    echo "   CVV: 123"
else
    echo "❌ Some systems are not working"
    echo ""
    echo "🔧 Quick Fix Commands:"
    echo ""
    echo "# Start Razorpay server:"
    echo "cd '/Users/namitraj/Desktop/saas full stack' && node razorpayIntegration.js &"
    echo ""
    echo "# Start main backend:"
    echo "cd '/Users/namitraj/Desktop/saas full stack' && npm start &"
    echo ""
    echo "# Start frontend:"
    echo "cd '/Users/namitraj/Desktop/saas full stack/my-app' && npm run dev"
fi
echo ""

