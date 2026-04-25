/**
 * app.js — Express app builder for messaging-service.
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');

const messageRoutes = require('./routes/messageRoutes');
const internalRoutes = require('./routes/internalRoutes');

const app = express();

app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());

const SERVICE_NAME = process.env.SERVICE_NAME || 'messaging-service';

if (process.env.NODE_ENV !== 'test') {
    try {
        const swaggerUi = require('swagger-ui-express');
        const YAML = require('yamljs');
        const swaggerDocument = YAML.load(path.join(__dirname, '..', 'swagger.yaml'));
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    } catch (e) {
        console.warn(`[${SERVICE_NAME}] swagger.yaml missing — skipping /api-docs`);
    }
}

app.use('/api', messageRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/internal', internalRoutes);

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: SERVICE_NAME,
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.json({
        service: SERVICE_NAME,
        description: 'Actor-to-Actor Messaging Service',
        version: '1.0.0'
    });
});

// Catch errors that bubble out of middleware (notably multer's file-size /
// file-filter rejections) and return clean JSON instead of Express's default
// HTML error page. Without this, an oversized attachment would 500 with a
// useless body and the chat would just say "Failed to send".
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    if (err) {
        const isMulter = err.name === 'MulterError' || /Unsupported file/.test(err.message || '');
        const status = isMulter ? 400 : (err.statusCode || 500);
        return res.status(status).json({
            error: err.message || 'Internal server error',
        });
    }
    next();
});

module.exports = app;
