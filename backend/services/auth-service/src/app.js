const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('passport');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Load env vars
dotenv.config();

// Fail fast if critical secrets are missing in production — never silently fall back.
if (process.env.NODE_ENV === 'production') {
    const required = ['SESSION_SECRET', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'MONGODB_URI'];
    const missing = required.filter((k) => !process.env[k]);
    if (missing.length) {
        console.error(`[auth-service] Missing required env vars: ${missing.join(', ')}`);
        process.exit(1);
    }
}

// Passport config
require('./config/passport');

const app = express();

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false
}));

// Session Middleware (Required for Passport OAuth)
app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-only-insecure-session-secret',
    resave: false,
    saveUninitialized: false
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// CORS Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

// Body parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging Middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Swagger API Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Health Check
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Auth Service is running',
        version: '1.0.0'
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error Handler (must be last)
app.use(errorHandler);

module.exports = app;
