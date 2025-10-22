const express = require('express');
const router = express.Router();
const Product = require('./models/Product');
const User = require('./model');
const CartItem = require('./models/Cart'); // Ensure the correct path to the Cart model
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('./middleware');
const Setup = require('./Setup.js');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

// Register route
router.post('/register', async (req, res) => {
    const { name, email, password, businessName, businessType, businessPhone, businessAddress, businessDescription } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = new User({ name, email, password, businessName, businessType, businessPhone, businessAddress, businessDescription });
        await newUser.save();
        return res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('[REGISTER] error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Profile route
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('[PROFILE] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Sign-in route
router.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        return res.status(200).json({ message: 'Login successful', userId: user._id, token });
    } catch (error) {
        console.error('[SIGNIN] error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Add product route
router.post('/products', async (req, res) => {
    try {
        const { productName, userId } = req.body;

        // Debugging logs to inspect the request body
        console.log('[ADD PRODUCT] Request body:', req.body);

        // Validate required fields
        if (!productName || !userId) {
            console.error('[ADD PRODUCT] Missing required fields: productName or userId');
            return res.status(400).json({ message: 'Product name and user ID are required.' });
        }

        // Debugging logs to inspect the product instance
        console.log('[ADD PRODUCT] Creating product instance with:', {
            productName,
            userId,
            description: req.body.description || '',
            price: req.body.price || 0,
            category: req.body.category || 'General',
            stock: req.body.stock || 0,
            imageUrl: req.body.imageUrl || ''
        });

        // Create a new product instance
        const newProduct = new Product({
            productName,
            userId,
            description: req.body.description || '',
            price: req.body.price || 0,
            category: req.body.category || 'General',
            stock: req.body.stock || 0,
            imageUrl: req.body.imageUrl || '' // Default to empty string if imageUrl is not provided
        });

        // Save the product to the database
        try {
            const savedProduct = await newProduct.save();
            console.log('[ADD PRODUCT] Product saved successfully:', savedProduct);
            res.status(201).json({ message: 'Product added successfully', product: savedProduct });
        } catch (dbError) {
            console.error('[ADD PRODUCT] Database error:', dbError);
            res.status(500).json({ message: 'Failed to save product to the database.' });
        }
    } catch (error) {
        console.error('[ADD PRODUCT] Unexpected error:', error);
        res.status(500).json({ message: 'Server error while adding product.' });
    }
});
router.get('/products', async (req, res) => {
    try {
        const { userId } = req.query; // Support filtering by userId via query param
        const filter = userId ? { userId } : {};
        const products = await Product.find(filter);
        res.status(200).json(products);
    } catch (error) {
        console.error('[GET PRODUCTS] Error:', error);
        res.status(500).json({ message: 'Server error while fetching products.' });
    }
});

// Get a single product by ID
router.get('/products/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        res.status(200).json(product);
    } catch (error) {
        console.error('[GET PRODUCT BY ID] Error:', error);
        res.status(500).json({ message: 'Server error while fetching product.' });
    }
});

// Add to cart route
router.post('/cart', authMiddleware, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.user.id; // Assuming user ID is available from auth middleware

        // Validate required fields
        if (!productId || !quantity) {
            return res.status(400).json({ message: 'Product ID and quantity are required.' });
        }

        // Check if the product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        // Add product to the cart with product details
        const cartItem = {
            productId,
            quantity,
            userId,
            productName: product.productName,
            price: product.price,
            imageUrl: product.imageUrl || '',
        };
        try {
            const savedCartItem = await CartItem.create(cartItem);
            console.log('[ADD TO CART] Cart item saved successfully:', savedCartItem);
            res.status(201).json({ message: 'Product added to cart successfully', cartItem: savedCartItem });
        } catch (error) {
            console.error('[ADD TO CART] Error saving cart item:', error);
            res.status(500).json({ message: 'Server error while adding to cart.' });
        }


    } catch (error) {
        console.error('[ADD TO CART] Unexpected error:', error);
        res.status(500).json({ message: 'Server error while adding to cart.' });
    }
});

// Get cart items for a user
router.get('/cart', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const cartItems = await CartItem.find({ userId }).populate('productId');
        res.status(200).json({ cartItems });
    } catch (error) {
        console.error('[GET CART] Error:', error);
        res.status(500).json({ message: 'Server error while fetching cart.' });
    }
});

// Delete a cart item
router.delete('/cart/:itemId', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.params;

        const deletedItem = await CartItem.findOneAndDelete({ _id: itemId, userId });

        if (!deletedItem) {
            return res.status(404).json({ message: 'Cart item not found.' });
        }

        res.status(200).json({ message: 'Cart item removed successfully.' });
    } catch (error) {
        console.error('[DELETE CART ITEM] Error:', error);
        res.status(500).json({ message: 'Server error while deleting cart item.' });
    }
});

// Checkout/Purchase route
router.post('/checkout', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { cartItems, totalAmount, shippingAddress, paymentMethod } = req.body;

        // Validate required fields
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: 'Cart is empty.' });
        }

        if (!totalAmount || !shippingAddress) {
            return res.status(400).json({ message: 'Total amount and shipping address are required.' });
        }

        // Create order record (simplified - you'd typically have an Order model)
        const order = {
            userId,
            cartItems,
            totalAmount,
            shippingAddress,
            paymentMethod: paymentMethod || 'COD',
            status: 'Pending',
            orderDate: new Date(),
        };

        console.log('[CHECKOUT] Order created:', order);

        // Clear cart after successful checkout
        await CartItem.deleteMany({ userId });

        res.status(201).json({
            message: 'Order placed successfully!',
            order,
            orderId: `ORD-${Date.now()}`
        });
    } catch (error) {
        console.error('[CHECKOUT] Error:', error);
        res.status(500).json({ message: 'Server error while processing checkout.' });
    }
});

module.exports = router;