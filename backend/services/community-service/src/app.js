/**
 * app.js — Express app builder for community-service.
 *
 * Split from index.js so integration tests can mount the app without binding
 * a port or connecting to MongoDB. index.js handles bootstrap.
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());

const SERVICE_NAME = process.env.SERVICE_NAME || 'community-service';

// Skip swagger in tests — the YAML load adds noise + the file may not exist
// in clean checkouts
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
        description: 'Community Management Service',
        version: '1.0.0'
    });
});

const userProfileRoutes = require('./routes/userProfileRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const statusRoutes = require('./routes/statusRoutes');
const reportRoutes = require('./routes/reportRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const internalRoutes = require('./routes/internalRoutes');

app.use('/api/profiles', userProfileRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/statuses', statusRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/internal', internalRoutes);

module.exports = app;
