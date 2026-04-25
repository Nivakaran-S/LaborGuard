require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5002;
const SERVICE_NAME = process.env.SERVICE_NAME || 'community-service';
const MONGODB_URI = process.env.MONGODB_URI;

const connectMongoDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            dbName: process.env.MONGODB_DB_NAME || 'laborguard-community'
        });
        console.log(`[${SERVICE_NAME}] Connected to MongoDB`);
    } catch (error) {
        console.error(`[${SERVICE_NAME}] MongoDB connection error:`, error.message);
        setTimeout(connectMongoDB, 5000);
    }
};

const startServer = async () => {
    await connectMongoDB();
    app.listen(PORT, () => {
        console.log(`[${SERVICE_NAME}] Server running on port ${PORT}`);
    });
};

startServer();
