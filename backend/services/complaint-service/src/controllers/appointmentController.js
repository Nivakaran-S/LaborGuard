const appointmentService = require('../services/appointmentService');

/**
 * @desc    Get all appointments
 * @route   GET /api/appointments
 * @access  Private (admin only)
 */
const getAllAppointments = async (req, res, next) => {
  try {
    const result = await appointmentService.getAllAppointments(req.query);

    res.status(200).json({
      success: true,
      data: result.appointments,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get appointments for the authenticated worker
 * @route   GET /api/appointments/my
 * @access  Private (worker)
 */
const getMyAppointments = async (req, res, next) => {
  try {
    const result = await appointmentService.getMyAppointments(req.user.userId, req.query);

    res.status(200).json({
      success: true,
      data: result.appointments,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get appointments assigned to the authenticated legal officer
 * @route   GET /api/appointments/assigned
 * @access  Private (lawyer)
 */
const getAssignedAppointments = async (req, res, next) => {
  try {
    const result = await appointmentService.getAssignedAppointments(req.user.userId, req.query);

    res.status(200).json({
      success: true,
      data: result.appointments,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single appointment by ID
 * @route   GET /api/appointments/:id
 * @access  Private (worker — own, lawyer — assigned, admin — any)
 */
const getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await appointmentService.getAppointmentById(req.params.id, req.user);

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Confirm an appointment and add meeting details
 * @route   PATCH /api/appointments/:id/confirm
 * @access  Private (admin only)
 */
const confirmAppointment = async (req, res, next) => {
  try {
    const appointment = await appointmentService.confirmAppointment(
      req.params.id,
      req.body,
      req.user
    );

    res.status(200).json({
      success: true,
      message: 'Appointment confirmed successfully.',
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reschedule an appointment
 * @route   PATCH /api/appointments/:id/reschedule
 * @access  Private (admin, lawyer — assigned only)
 */
const rescheduleAppointment = async (req, res, next) => {
  try {
    const appointment = await appointmentService.rescheduleAppointment(
      req.params.id,
      req.body,
      req.user
    );

    res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully.',
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel an appointment
 * @route   PATCH /api/appointments/:id/cancel
 * @access  Private (admin only)
 */
const cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await appointmentService.cancelAppointment(
      req.params.id,
      req.body,
      req.user
    );

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully.',
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Worker requests an appointment for their own complaint (W20)
 * @route   POST /api/appointments/request
 * @access  Private (worker)
 */
const requestAppointment = async (req, res, next) => {
  try {
    const appointment = await appointmentService.requestAppointment(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Appointment requested. An admin will confirm it shortly.',
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assigned lawyer records outcome notes after a meeting (L5)
 * @route   PATCH /api/appointments/:id/outcome
 * @access  Private (assigned lawyer or admin)
 */
const recordAppointmentOutcome = async (req, res, next) => {
  try {
    const appointment = await appointmentService.recordAppointmentOutcome(
      req.params.id,
      req.body,
      req.user
    );
    res.status(200).json({
      success: true,
      message: 'Outcome recorded successfully.',
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllAppointments,
  getMyAppointments,
  getAssignedAppointments,
  getAppointmentById,
  confirmAppointment,
  rescheduleAppointment,
  cancelAppointment,
  requestAppointment,
  recordAppointmentOutcome
};