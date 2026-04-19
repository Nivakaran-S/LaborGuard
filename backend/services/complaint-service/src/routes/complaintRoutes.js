const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const { authenticate, authorize } = require('../middleware/auth');
const {
  validate,
  createComplaintRules,
  updateComplaintRules,
  updateStatusRules,
  assignComplaintRules,
  validateObjectId,
  listComplaintsRules
} = require('../utils/validator');
const { upload } = require('../utils/cloudinary');

// GET /api/complaints/stats
router.get('/stats', authenticate, authorize('admin', 'lawyer', 'ngo'), complaintController.getComplaintStats);

// GET /api/complaints/my
router.get('/my', authenticate, authorize('worker'), listComplaintsRules, validate, complaintController.getMyComplaints);

// POST /api/complaints
router.post('/', authenticate, authorize('worker'), upload.array('evidence', 5), createComplaintRules, validate, complaintController.createComplaint);

// GET /api/complaints
router.get('/', authenticate, authorize('admin', 'lawyer', 'ngo'), listComplaintsRules, validate, complaintController.getAllComplaints);

// GET /api/complaints/:id
router.get('/:id', authenticate, authorize('worker', 'admin', 'lawyer', 'ngo'), validateObjectId, validate, complaintController.getComplaintById);

// PATCH /api/complaints/:id
router.patch('/:id', authenticate, authorize('worker'), validateObjectId, updateComplaintRules, validate, complaintController.updateComplaint);

// PATCH /api/complaints/:id/status
router.patch('/:id/status', authenticate, authorize('admin', 'lawyer'), validateObjectId, updateStatusRules, validate, complaintController.updateComplaintStatus);

// PATCH /api/complaints/:id/assign
router.patch('/:id/assign', authenticate, authorize('admin'), validateObjectId, assignComplaintRules, validate, complaintController.assignComplaint);

// DELETE /api/complaints/:id
router.delete('/:id', authenticate, validateObjectId, validate, complaintController.deleteComplaint);

// POST /api/complaints/:id/attachments
router.post('/:id/attachments', authenticate, authorize('worker', 'admin'), validateObjectId, upload.single('file'), complaintController.uploadAttachment);

// GET /api/complaints/:id/report
router.get('/:id/report', authenticate, authorize('worker', 'admin', 'lawyer', 'ngo'), validateObjectId, complaintController.generateReport);

module.exports = router;