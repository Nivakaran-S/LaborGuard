const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const preferenceController = require('../controllers/preferenceController');
const { protect } = require('../middleware/authMiddleware');

// Internal route: other services POST here via Kafka or HTTP (no JWT needed)
router.post('/', notificationController.createNotification);

// All user-facing routes require a valid JWT
router.get('/',                 protect, notificationController.getNotifications);
router.get('/unread-count',     protect, notificationController.getUnreadCount);
router.patch('/read-all',       protect, notificationController.markAllAsRead);

// Preferences (Phase 4.3)
router.get('/preferences',      protect, preferenceController.getPreferences);
router.patch('/preferences',    protect, preferenceController.updatePreferences);

// These still use :id (notification document ID) — safe, no spoofing risk
router.patch('/:id/read',       protect, notificationController.markAsRead);
router.delete('/:id',           protect, notificationController.deleteNotification);

module.exports = router;