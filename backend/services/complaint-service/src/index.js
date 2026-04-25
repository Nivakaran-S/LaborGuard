const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
const cors = require('cors');
const helmet = require('helmet');

const complaintRoutes = require('./routes/complaintRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const registryRoutes = require('./routes/registryRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(helmet({
    contentSecurityPolicy: false
}));
app.use(express.json());

// Disable ETag generation to prevent 304 responses
app.set('etag', false);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Environment variables
const PORT = process.env.PORT || 5003;
const SERVICE_NAME = process.env.SERVICE_NAME || 'complaint-service';
const MONGODB_URI = process.env.MONGODB_URI;

// MongoDB Connection
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
        description: 'Complaint Management Service',
        version: '1.0.0'
    });
});

// Routes
app.use('/api/complaints', complaintRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/registry', registryRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
    await connectMongoDB();
    app.listen(PORT, () => {
        console.log(`[${SERVICE_NAME}] Server running on port ${PORT}`);
    });
};

startServer();
