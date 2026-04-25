const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const cors = require('cors');
const helmet = require('helmet');
const messageRoutes = require('./routes/messageRoutes');
const internalRoutes = require('./routes/internalRoutes');

require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(helmet({
    contentSecurityPolicy: false
}));
app.use(express.json());

// Swagger Documentation
const swaggerDocument = YAML.load(path.join(__dirname, '..', 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Environment variables
const PORT = process.env.PORT || 5005;
const SERVICE_NAME = process.env.SERVICE_NAME || 'messaging-service';
const MONGODB_URI = process.env.MONGODB_URI;

// MongoDB Connection
const connectMongoDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            dbName: process.env.MONGODB_DB_NAME || 'laborguard-messaging'
        });
        console.log(`[${SERVICE_NAME}] Connected to MongoDB`);
    } catch (error) {
        console.error(`[${SERVICE_NAME}] MongoDB connection error:`, error.message);
        setTimeout(connectMongoDB, 5000);
    }
};

// Routes
app.use('/api', messageRoutes);
app.use('/api/messages', messageRoutes); // Supporting both prefixes if needed
app.use('/api/internal', internalRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: SERVICE_NAME,
        timestamp: new Date().toISOString()
    });
});

// Root Endpoint
app.get('/', (req, res) => {
    res.json({
        service: SERVICE_NAME,
        description: 'Actor-to-Actor Messaging Service',
        version: '1.0.0'
    });
});

// Start server
const startServer = async () => {
    await connectMongoDB();
    app.listen(PORT, () => {
        console.log(`[${SERVICE_NAME}] Server running on port ${PORT}`);
    });
};

startServer();
