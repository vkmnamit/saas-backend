import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import Product from "./models/Product.js";
import Setup from "./Setup.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
// Allow CORS for dev: accept localhost origins and allow credentials (cookies)
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        try {
            const u = new URL(origin);
            if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
                return callback(null, true);
            }
        } catch (err) {
            return callback(new Error("Invalid Origin"), false);
        }
    }
})); app.use(express.json()); app.use("/api/users", userRoutes); app.use("/api/products", productRoutes); app.use("/api/setup", setupRoutes);
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/setup", setupRoutes);
app.get("/api/setup", async (req, res) => {
    try {
        const setups = await Setup.find({});
        res.json(setups);
    } catch (error) {
        res.status(500).json({ message: "Error fetching setup data", error: error.message });
    }
});

connectDB();

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 