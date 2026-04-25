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

module.exports = app;
