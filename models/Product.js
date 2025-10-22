const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    description: { type: String },
    price: { type: Number, default: 0 },
    category: { type: String },
    imageUrl: { type: String }, // Made imageUrl optional
    stock: { type: Number, default: 0 },
    // store userId as ObjectId referencing users; frontend will send the user's _id string
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
