const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 10,           // Connection pooling: up to 10 concurrent connections
            serverSelectionTimeoutMS: 5000, // Fail fast if MongoDB is unavailable
            socketTimeoutMS: 45000,    // Close sockets after 45s inactivity
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
