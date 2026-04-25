/**
 * internalRoutes.js — service-to-service routes for messaging-service.
 * Guarded by INTERNAL_SERVICE_SECRET header.
 */

const express = require('express');
const router = express.Router();
const internalEventsController = require('../controllers/internalEventsController');

const internalOnly = (req, res, next) => {
    const secret = req.get('x-internal-secret');
    const expected = process.env.INTERNAL_SERVICE_SECRET;
    if (!expected || secret !== expected) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    next();
};

router.use(internalOnly);
router.post('/events/:topic', internalEventsController.dispatchEvent);

module.exports = router;
