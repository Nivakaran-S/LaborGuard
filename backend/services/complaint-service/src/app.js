/**
 * app.js — Express app builder for complaint-service.
 *
 * Split out from index.js so integration tests can import the wired-up app
 * without binding a port or connecting to MongoDB. index.js wraps this with
 * the bootstrap (DB connect + listen).
 */

const express = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const cors = require('cors');
const helmet = require('helmet');

const complaintRoutes = require('./routes/complaintRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const registryRoutes = require('./routes/registryRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const SERVICE_NAME = process.env.SERVICE_NAME || 'complaint-service';

const app = express();

app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.set('etag', false);

// Swagger only in non-test environments — loading the YAML adds noise to test output
if (process.env.NODE_ENV !== 'test') {
    try {
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
        description: 'Complaint Management Service',
        version: '1.0.0'
    });
});

app.use('/api/complaints', complaintRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/registry', registryRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
