const express = require('express');
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All admin routes are protected and restricted to 'admin' role
router.use(protect);
router.use(authorize('admin'));

// GET /api/admin/users
router.get('/users', adminController.getAllUsers);

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', adminController.updateUserRole);

// PUT /api/admin/users/:id/approve
router.put('/users/:id/approve', adminController.approveUser);

// PUT /api/admin/users/:id/reject
router.put('/users/:id/reject', adminController.rejectUser);

// GET /api/admin/users/:id/analyze
router.get('/users/:id/analyze', adminController.analyzeUserDocuments);

// PUT /api/admin/users/:id/status
router.put('/users/:id/status', adminController.deactivateUser);

// DELETE /api/admin/users/:id
router.delete('/users/:id', adminController.deleteUser);

// Moderation actions (Phase 5.4)
router.post('/users/:id/warn',    adminController.warnUser);
router.post('/users/:id/suspend', adminController.suspendUser);
router.post('/users/:id/ban',     adminController.banUser);
router.post('/users/:id/lift',    adminController.liftSuspension);

module.exports = router;
