const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// Load env vars (useful if app.js is imported directly for testing)
dotenv.config();

const app = express();

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false
}));

// CORS Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

// Body parsing Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Logging Middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Swagger Documentation
const swaggerDocument = YAML.load(path.join(__dirname, '..', 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Job Service is running',
        version: '1.0.0'
    });
});

// We will mount Job Routes here later
const jobRoutes = require('./routes/jobRoutes');
app.use('/api/jobs', jobRoutes);

// Health check endpoint — required for Docker healthcheck
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));


// Generic Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Server Error'
    });
});

module.exports = app;
