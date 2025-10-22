const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Bulk upload route
router.post('/api/products/bulk-upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        console.log('Processing Excel file:', req.file.originalname);

        // Read the Excel file
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert sheet to JSON
        const data = xlsx.utils.sheet_to_json(worksheet);

        if (!data || data.length === 0) {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'Excel file is empty or has no valid data'
            });
        }

        console.log(`Found ${data.length} rows in Excel file`);

        // Get userId from cookies or body (depending on your auth setup)
        const userId = req.cookies?.userId || req.body.userId || '000000000000000000000000';

        // Map and validate Excel data to Product schema
        const products = data.map((row, index) => {
            // Support multiple column name variations
            const productName = row.productName || row['Product Name'] || row.name || row.Name;
            const description = row.description || row.Description || '';
            const price = Number(row.price || row.Price) || 0;
            const stock = Number(row.stock || row.Stock || row.quantity || row.Quantity) || 0;
            const category = row.category || row.Category || 'General';
            const imageUrl = row.imageUrl || row['Image URL'] || row.image || row.Image || '';

            return {
                productName: String(productName || '').trim(),
                description: String(description).trim(),
                price: price,
                stock: stock,
                category: String(category).trim(),
                imageUrl: String(imageUrl).trim(),
                userId: userId
            };
        });

        // Validate required fields and collect detailed error info
        const invalidProducts = [];
        const invalidRows = [];

        products.forEach((p, index) => {
            const rowNumber = index + 2; // +2 because index starts at 0 and row 1 is header
            const errors = [];

            if (!p.productName || p.productName === '') {
                errors.push('Missing productName');
            }
            if (p.price <= 0 || isNaN(p.price)) {
                errors.push('Invalid price (must be > 0)');
            }

            if (errors.length > 0) {
                invalidProducts.push(p);
                invalidRows.push({
                    row: rowNumber,
                    productName: p.productName || '(empty)',
                    price: p.price,
                    errors: errors
                });
                console.log(`Invalid product at row ${rowNumber}:`, {
                    productName: p.productName || '(empty)',
                    price: p.price,
                    errors
                });
            }
        });

        if (invalidProducts.length > 0) {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);

            // Create detailed error message
            const errorDetails = invalidRows.map(r =>
                `Row ${r.row}: ${r.errors.join(', ')}`
            ).slice(0, 10).join('\n'); // Show first 10 errors

            return res.status(400).json({
                success: false,
                message: `Invalid data found in ${invalidProducts.length} row(s). Please fix the following issues:`,
                invalidCount: invalidProducts.length,
                invalidRows: invalidRows.slice(0, 10), // Return first 10 invalid rows
                details: errorDetails
            });
        }

        // Insert products into database
        console.log('Inserting products into database...');
        const result = await Product.insertMany(products, { ordered: false });

        // Clean up uploaded file after successful processing
        fs.unlinkSync(req.file.path);

        console.log(`Successfully inserted ${result.length} products`);

        res.status(201).json({
            success: true,
            message: 'Products uploaded successfully',
            count: result.length,
            products: result.map(p => ({
                id: p._id,
                productName: p.productName,
                price: p.price,
                stock: p.stock
            }))
        });

    } catch (err) {
        console.error('Bulk upload error:', err);

        // Clean up uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: 'Failed to upload products',
            error: err.message
        });
    }
});

// Bulk delete route
router.post('/api/products/bulk-delete', async (req, res) => {
    try {
        const { productIds } = req.body;

        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No product IDs provided'
            });
        }

        console.log(`Deleting ${productIds.length} products`);

        // Get userId from cookies
        const userId = req.cookies?.userId || req.body.userId;

        // Build delete query
        const deleteQuery = { _id: { $in: productIds } };
        if (userId) {
            deleteQuery.userId = userId; // Only delete own products
        }

        const result = await Product.deleteMany(deleteQuery);

        console.log(`Deleted ${result.deletedCount} products`);

        res.json({
            success: true,
            message: `Successfully deleted ${result.deletedCount} product(s)`,
            deletedCount: result.deletedCount
        });

    } catch (err) {
        console.error('Bulk delete error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to delete products',
            error: err.message
        });
    }
});

module.exports = router;
