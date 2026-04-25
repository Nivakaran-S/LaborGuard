/**
 * index.js — server bootstrap.
 *
 * App wiring lives in app.js (so tests can import a port-less app).
 * This file connects MongoDB and starts listening.
 */

const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5003;
const SERVICE_NAME = process.env.SERVICE_NAME || 'complaint-service';
const MONGODB_URI = process.env.MONGODB_URI;

const connectMongoDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            dbName: process.env.MONGODB_DB_NAME || 'laborguard-complaint'
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
