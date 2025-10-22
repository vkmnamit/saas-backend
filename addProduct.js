import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import Product from "./models/Product.js";
import Cart from "./models/Cart.js";
import mongoose from "mongoose";

const app = express();
// Allow CORS for dev: accept localhost origins and allow credentials (cookies)
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        try {
            const u = new URL(origin);
            if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return callback(null, true);
        } catch (e) {
            // fall through
        }
        if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
        return callback(new Error('CORS not allowed'), false);
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

connectDB();

// Route to add a product
app.post("/api/products", async (req, res) => {
    try {
        console.log("Request body:", req.body); // Debugging request body
        const { productName, description, price, category, stock, imageUrl } = req.body;

        const product = new Product({
            productName,
            description,
            price,
            category,
            stock,
            imageUrl, // Directly using the image URL from the request body
        });
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        console.error("Error details:", error); // Log detailed error information
        res.status(500).json({ message: "Error adding product", error: error.message });
    }
});

// Enhanced error handling and logging for product routes

// Route to get all products of a user
app.get("/api/products/:userId", async (req, res) => {
    try {
        console.log("Fetching products for user:", req.params.userId);
        const products = await Product.find({ userId: req.params.userId });
        console.log("Products fetched successfully:", products);
        res.json(products);
    } catch (error) {
        console.error("Error fetching products for user:", req.params.userId, error);
        res.status(500).json({ message: "Error fetching products", error: error.message });
    }
});

// Route to get all products (public)
app.get("/api/products", async (req, res) => {
    try {
        console.log("Fetching all products");
        const products = await Product.find({});
        console.log("All products fetched successfully:", products);
        res.json(products);
    } catch (error) {
        console.error("Error fetching all products:", error);
        res.status(500).json({ message: "Error fetching products", error: error.message });
    }
});

// Route to get single product by id
app.get("/api/products/single/:productId", async (req, res) => {
    try {
        console.log("Fetching product by ID:", req.params.productId);
        const product = await Product.findById(req.params.productId);
        if (!product) {
            console.error("Product not found for ID:", req.params.productId);
            return res.status(404).json({ message: 'Product not found' });
        }
        console.log("Product fetched successfully:", product);
        res.json(product);
    } catch (error) {
        console.error("Error fetching product by ID:", req.params.productId, error);
        res.status(500).json({ message: "Error fetching product", error: error.message });
    }
});

// Cart endpoints
// Add item to cart
app.post('/api/cart', async (req, res) => {
    try {
        const { userId, productId, quantity, productName, price } = req.body;
        if (!userId || !productId) return res.status(400).json({ message: 'userId and productId required' });

        // If an item already exists for this user/product, increment quantity
        let existing = await Cart.findOne({ userId, productId });
        if (existing) {
            existing.quantity = (existing.quantity || 0) + (quantity || 1);
            await existing.save();
            return res.status(200).json({ message: 'Cart updated', item: existing });
        }

        const cartItem = new Cart({ userId, productId, quantity: quantity || 1, productName, price });
        await cartItem.save();
        res.status(201).json({ message: 'Added to cart', item: cartItem });
    } catch (error) {
        res.status(500).json({ message: 'Error adding to cart', error: error.message });
    }
});

// Get cart items for a user
app.get('/api/cart/:userId', async (req, res) => {
    try {
        const items = await Cart.find({ userId: req.params.userId });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching cart', error: error.message });
    }
});
app.post('/api/analytics', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ message: 'userId required' });

        // Aggregate total sales and number of orders
        const salesData = await Cart.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: { $multiply: ["$price", "$quantity"] } },
                    totalItems: { $sum: "$quantity" },
                    uniqueProducts: { $addToSet: "$productId" }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalSales: 1,
                    totalItems: 1,
                    numberOfProducts: { $size: "$uniqueProducts" }
                }
            }
        ]);

        res.json(salesData[0] || { totalSales: 0, totalItems: 0, numberOfProducts: 0 });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching analytics', error: error.message });
    }
});

// Start server
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Keep and ensure only this returns analytics JSON
app.get('/api/analytics', async (req, res) => {
    try {
        const now = new Date();
        const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

        const aggregateOptions = periodStart => [
            { $match: { createdAt: { $gte: periodStart } } },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalOrderValue: { $sum: { $multiply: ["$price", "$quantity"] } },
                    activeUsers: { $addToSet: "$userId" }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalOrders: 1,
                    totalOrderValue: 1,
                    activeUsers: { $size: "$activeUsers" }
                }
            }
        ];

        // Get time series data for the last 12 weeks
        const weeklyTimeSeries = [];
        for (let i = 11; i >= 0; i--) {
            const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7));
            const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((i - 1) * 7));

            const weekData = await Cart.aggregate([
                { $match: { createdAt: { $gte: weekStart, $lt: weekEnd } } },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalOrderValue: { $sum: { $multiply: ["$price", "$quantity"] } },
                        activeUsers: { $addToSet: "$userId" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalOrders: 1,
                        totalOrderValue: 1,
                        activeUsers: { $size: "$activeUsers" }
                    }
                }
            ]);

            weeklyTimeSeries.push({
                week: `Week ${12 - i}`,
                date: weekStart.toISOString().split('T')[0],
                ...(weekData[0] || { totalOrders: 0, totalOrderValue: 0, activeUsers: 0 })
            });
        }

        // Get daily data for the last 30 days
        const dailyTimeSeries = [];
        for (let i = 29; i >= 0; i--) {
            const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);

            const dayData = await Cart.aggregate([
                { $match: { createdAt: { $gte: dayStart, $lt: dayEnd } } },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalOrderValue: { $sum: { $multiply: ["$price", "$quantity"] } },
                        activeUsers: { $addToSet: "$userId" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalOrders: 1,
                        totalOrderValue: 1,
                        activeUsers: { $size: "$activeUsers" }
                    }
                }
            ]);

            dailyTimeSeries.push({
                day: dayStart.toISOString().split('T')[0],
                date: dayStart.toISOString().split('T')[0],
                ...(dayData[0] || { totalOrders: 0, totalOrderValue: 0, activeUsers: 0 })
            });
        }

        const [weekly, monthly, threeMonthly, sixMonthly, yearly] = await Promise.all([
            Cart.aggregate(aggregateOptions(oneWeekAgo)),
            Cart.aggregate(aggregateOptions(oneMonthAgo)),
            Cart.aggregate(aggregateOptions(threeMonthsAgo)),
            Cart.aggregate(aggregateOptions(sixMonthsAgo)),
            Cart.aggregate(aggregateOptions(oneYearAgo)),
        ]);

        res.json({
            // Summary data
            weekly: weekly[0] || { totalOrders: 0, totalOrderValue: 0, activeUsers: 0 },
            monthly: monthly[0] || { totalOrders: 0, totalOrderValue: 0, activeUsers: 0 },
            threeMonthly: threeMonthly[0] || { totalOrders: 0, totalOrderValue: 0, activeUsers: 0 },
            sixMonthly: sixMonthly[0] || { totalOrders: 0, totalOrderValue: 0, activeUsers: 0 },
            yearly: yearly[0] || { totalOrders: 0, totalOrderValue: 0, activeUsers: 0 },

            // Time series data
            weeklyTimeSeries,
            dailyTimeSeries,

            // Real-time stats
            lastUpdated: new Date().toISOString(),
            totalProducts: await Product.countDocuments(),
            totalCartItems: await Cart.countDocuments()
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ message: 'Error fetching analytics', error: error.message });
    }
});

// Settings endpoints
const settings = { storeName: 'My Store', currency: 'USD', taxRate: 5, shippingFee: 10, theme: 'light' };

// Get Settings
app.get('/api/settings', (req, res) => {
    res.json(settings);
});

// Update Settings
app.post('/api/settings', (req, res) => {
    const { storeName, currency, taxRate, shippingFee, theme } = req.body;
    settings.storeName = storeName;
    settings.currency = currency;
    settings.taxRate = taxRate;
    settings.shippingFee = shippingFee;
    settings.theme = theme;
    res.json({ message: 'Settings updated successfully', settings });
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

