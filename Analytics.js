import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema({
    totalOrders: { type: Number, default: 0 },
    totalOrderValue: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },
    paymentMethod1: { type: Number, default: 0 },
    paymentMethod2: { type: Number, default: 0 },
    paymentMethod3: { type: Number, default: 0 },
    WeeklySales: { type: Number, default: 0 },
    MonthlySales: { type: Number, default: 0 },
    ThreeMonthlySales: { type: Number, default: 0 },
    SixMonthlySales: { type: Number, default: 0 },
    YearlySales: { type: Number, default: 0 },
});

const Analytics = mongoose.model("Analytics", analyticsSchema);

export default Analytics;
