const express = require('express');
const router = express.Router();

const appointmentController = require('../controllers/appointmentController');
const { authenticate, authorize } = require('../middleware/auth');
const {
  validate,
  validateObjectId,
  confirmAppointmentRules,
  rescheduleAppointmentRules,
  cancelAppointmentRules,
  listAppointmentRules
} = require('../utils/validator');

// POST /api/appointments/request — Worker requests an appointment (W20)
// Must register BEFORE /:id to avoid conflict.
router.post('/request', authenticate, authorize('worker'), appointmentController.requestAppointment);

// GET /api/appointments/my
router.get('/my', authenticate, authorize('worker'), listAppointmentRules, validate, appointmentController.getMyAppointments);

// GET /api/appointments/assigned
router.get('/assigned', authenticate, authorize('lawyer'), listAppointmentRules, validate, appointmentController.getAssignedAppointments);

// GET /api/appointments
router.get('/', authenticate, authorize('admin'), listAppointmentRules, validate, appointmentController.getAllAppointments);

// GET /api/appointments/:id
router.get('/:id', authenticate, authorize('worker', 'admin', 'lawyer'), validateObjectId, validate, appointmentController.getAppointmentById);

// PATCH /api/appointments/:id/confirm
router.patch('/:id/confirm', authenticate, authorize('admin'), validateObjectId, confirmAppointmentRules, validate, appointmentController.confirmAppointment);

// PATCH /api/appointments/:id/reschedule
router.patch('/:id/reschedule', authenticate, authorize('admin', 'lawyer'), validateObjectId, rescheduleAppointmentRules, validate, appointmentController.rescheduleAppointment);

// PATCH /api/appointments/:id/cancel
// [FIX] Workers can cancel their own appointments — was authorize('admin') only
router.patch('/:id/cancel', authenticate, authorize('admin', 'worker'), validateObjectId, cancelAppointmentRules, validate, appointmentController.cancelAppointment);

// PATCH /api/appointments/:id/outcome — Lawyer records post-meeting notes (L5)
router.patch('/:id/outcome', authenticate, authorize('lawyer', 'admin'), validateObjectId, validate, appointmentController.recordAppointmentOutcome);

module.exports = router;