const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');

// Create Invoice after successful payment
router.post('/create', async (req, res) => {
    try {
        const {
            userId,
            customerName,
            customerEmail,
            customerContact,
            items,
            subtotal,
            tax,
            discount,
            totalAmount,
            paymentDetails,
            billingAddress,
            notes
        } = req.body;

        // Validation
        if (!userId || !customerName || !customerEmail || !items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required invoice fields'
            });
        }

        if (!paymentDetails || !paymentDetails.razorpayOrderId || !paymentDetails.razorpayPaymentId) {
            return res.status(400).json({
                success: false,
                message: 'Payment details are required'
            });
        }

        // Create invoice
        const invoice = new Invoice({
            userId,
            customerName,
            customerEmail,
            customerContact,
            items,
            subtotal: subtotal || totalAmount,
            tax: tax || 0,
            discount: discount || 0,
            totalAmount,
            paymentDetails: {
                ...paymentDetails,
                paymentStatus: 'paid'
            },
            billingAddress: billingAddress || {},
            status: 'paid',
            notes: notes || '',
            paidDate: new Date()
        });

        await invoice.save();

        res.status(201).json({
            success: true,
            message: 'Invoice created successfully',
            invoice: {
                id: invoice._id,
                invoiceNumber: invoice.invoiceNumber,
                totalAmount: invoice.totalAmount,
                createdAt: invoice.createdAt
            }
        });

    } catch (error) {
        console.error('Error creating invoice:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create invoice',
            error: error.message
        });
    }
});

// Get all invoices for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10, status, startDate, endDate } = req.query;

        const query = { userId };

        // Filter by status if provided
        if (status) {
            query.status = status;
        }

        // Filter by date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const invoices = await Invoice.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('-paymentDetails.razorpaySignature'); // Don't send signature to frontend

        const count = await Invoice.countDocuments(query);

        res.json({
            success: true,
            invoices,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalInvoices: count
        });

    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch invoices',
            error: error.message
        });
    }
});

// Get single invoice by ID
router.get('/:invoiceId', async (req, res) => {
    try {
        const { invoiceId } = req.params;

        const invoice = await Invoice.findById(invoiceId)
            .populate('userId', 'name email')
            .select('-paymentDetails.razorpaySignature');

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        res.json({
            success: true,
            invoice
        });

    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch invoice',
            error: error.message
        });
    }
});

// Get invoice by invoice number
router.get('/number/:invoiceNumber', async (req, res) => {
    try {
        const { invoiceNumber } = req.params;

        const invoice = await Invoice.findOne({ invoiceNumber })
            .populate('userId', 'name email')
            .select('-paymentDetails.razorpaySignature');

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        res.json({
            success: true,
            invoice
        });

    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch invoice',
            error: error.message
        });
    }
});

// Get invoice analytics
router.get('/analytics/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate } = req.query;

        const matchQuery = { userId };

        if (startDate || endDate) {
            matchQuery.createdAt = {};
            if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
            if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
        }

        // Total revenue
        const revenueData = await Invoice.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalAmount' },
                    totalInvoices: { $sum: 1 },
                    averageInvoice: { $avg: '$totalAmount' }
                }
            }
        ]);

        // Revenue by month
        const monthlyRevenue = await Invoice.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    revenue: { $sum: '$totalAmount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
        ]);

        // Status breakdown
        const statusBreakdown = await Invoice.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    total: { $sum: '$totalAmount' }
                }
            }
        ]);

        // Recent invoices
        const recentInvoices = await Invoice.find(matchQuery)
            .sort({ createdAt: -1 })
            .limit(5)
            .select('invoiceNumber totalAmount status createdAt');

        res.json({
            success: true,
            analytics: {
                summary: revenueData[0] || { totalRevenue: 0, totalInvoices: 0, averageInvoice: 0 },
                monthlyRevenue,
                statusBreakdown,
                recentInvoices
            }
        });

    } catch (error) {
        console.error('Error fetching invoice analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch analytics',
            error: error.message
        });
    }
});

module.exports = router;
