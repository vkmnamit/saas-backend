require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authMiddleware = require('./middleware');
const userRoutes = require('./newRoute');
const invoiceRoutes = require('./api/invoiceRoutes');
const bulkUploadRoutes = require('./api/bulkUploadRoutes');

const app = express();
const PORT = process.env.PORT || 5002;

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/yourdbname';
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

const allowedOrigins = ['http://localhost:5174', 'http://localhost:5173'];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
        try {
            const u = new URL(origin);
            if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return callback(null, true);
        } catch (e) { }
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/users', userRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use(bulkUploadRoutes);

// Debugging log to confirm route registration
console.log('[SERVER] Routes registered: /api/users/*, /api/invoices/*, /api/products/bulk-upload');

// Middleware to log incoming requests
app.use((req, res, next) => {
    console.log(`[SERVER] Incoming request: ${req.method} ${req.url}`);
    next();
});

// Analytics endpoint
app.get('/api/analytics', (req, res) => {
    // Dummy analytics data; replace with real queries as needed
    res.json({
        totalOrders: 83,
        totalOrderValue: 43700,
        activeUsers: 51
    });
});

// Get all products from database
app.get('/api/products', async (req, res) => {
    try {
        const Product = require('./models/Product');
        const { userId } = req.query; // Support filtering by userId
        const filter = userId ? { userId } : {};
        const products = await Product.find(filter);
        res.json(products);
    } catch (error) {
        console.error('[GET ALL PRODUCTS] Error:', error);
        res.status(500).json({ message: 'Server error while fetching products.' });
    }
});

// Get product by ID
app.get('/api/products/:id', async (req, res) => {
    try {
        const Product = require('./models/Product');
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

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});
