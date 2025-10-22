import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/yourdbname';
        console.log(`Attempting to connect to MongoDB at URI: ${uri}`); // Log the connection URI
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected (product server)');
    } catch (err) {
        console.error('MongoDB connection error (product server):', err.message);
        process.exit(1);
    }
};

export default connectDB;
