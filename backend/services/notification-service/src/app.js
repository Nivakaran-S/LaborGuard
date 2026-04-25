/**
 * app.js — Express app builder for notification-service.
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());

const SERVICE_NAME = process.env.SERVICE_NAME || 'notification-service';

if (process.env.NODE_ENV !== 'test') {
    try {
        const swaggerUi = require('swagger-ui-express');
        const YAML = require('yamljs');
        const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    } catch (e) {
        console.warn(`[${SERVICE_NAME}] swagger.yaml missing — skipping /api-docs`);
    }
}

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
        description: 'Notification Service',
        version: '1.0.0'
    });
});

const notificationRoutes = require('./routes/notificationRoutes');
const internalRoutes = require('./routes/internalRoutes');
app.use('/api/notifications', notificationRoutes);
app.use('/api/internal', internalRoutes);

module.exports = app;
