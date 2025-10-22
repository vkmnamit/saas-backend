import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    description: String,
    price: Number,
    category: String,
    imageUrl: String,
    img: String,
    stock: Number,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
