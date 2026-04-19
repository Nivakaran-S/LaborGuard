const Appointment = require('../models/Appointment');
const LegalOfficerRegistry = require('../models/LegalOfficerRegistry');
const { sendAppointmentConfirmationEmail, sendAppointmentNotificationToOfficer } = require('./emailService');

// ─────────────────────────────────────────────
// Category → Specialization Mapping
// ─────────────────────────────────────────────

const CATEGORY_SPECIALIZATION_MAP = {
  wage_theft: 'labor_law',
  wrongful_termination: 'labor_law',
  harassment: 'harassment_law',
  discrimination: 'discrimination_law'
};

// Categories and priorities eligible for auto-booking
const APPOINTMENT_ELIGIBLE_CATEGORIES = Object.keys(CATEGORY_SPECIALIZATION_MAP);
const APPOINTMENT_ELIGIBLE_PRIORITIES = ['high', 'critical'];

/**
 * Check if a complaint is eligible for auto-booking
 */
const isEligibleForAppointment = (category, priority) => {
  return (
    APPOINTMENT_ELIGIBLE_CATEGORIES.includes(category) &&
    APPOINTMENT_ELIGIBLE_PRIORITIES.includes(priority)
  );
};

/**
 * Round Robin Assignment — load balanced by specialization
 *
 * Logic:
 * 1. Find all active officers with matching specialization
 * 2. Sort by activeAppointmentCount ASC (least loaded first)
 * 3. Tiebreak by lastAssignedAt ASC (assigned longest ago first)
 * 4. Pick the first officer in the sorted list
 */
const assignLegalOfficer = async (specialization) => {
  const officers = await LegalOfficerRegistry.find({
    specializations: specialization,
    isActive: true
  }).sort({
    activeAppointmentCount: 1,
    lastAssignedAt: 1
  });

  if (!officers || officers.length === 0) {
    const error = new Error(
      `No active legal officers available for specialization: ${specialization}`
    );
    error.statusCode = 503;
    throw error;
  }

  return officers[0];
};

/**
 * Calculate next available appointment slot
 * Schedules for next working day at 9AM
 */
const getNextAvailableSlot = () => {
  const now = new Date();
  const next = new Date(now);

  // Move to next day
  next.setDate(next.getDate() + 1);

  // Skip weekends
  if (next.getDay() === 6) next.setDate(next.getDate() + 2); // Saturday → Monday
  if (next.getDay() === 0) next.setDate(next.getDate() + 1); // Sunday → Monday

  // Set time to 9:00 AM
  next.setHours(9, 0, 0, 0);

  return next;
};

/**
 * Auto-create an appointment when admin approves a complaint
 * Called from complaintService.updateComplaintStatus
 */
const autoCreateAppointment = async (complaint, adminUser) => {
  const specialization = CATEGORY_SPECIALIZATION_MAP[complaint.category];

  // Pick the best available legal officer via round robin
  const officer = await assignLegalOfficer(specialization);
  const scheduledAt = getNextAvailableSlot();

  const appointment = await Appointment.create({
    complaintId: complaint._id,
    workerId: complaint.workerId,
    legalOfficerId: officer.officerId,
    category: complaint.category,
    specialization,
    scheduledAt,
    status: 'auto_booked',
    meetingType: 'online',
    notes: `Auto-booked based on complaint category: ${complaint.category}`
  });

  // Update officer load tracking
  await LegalOfficerRegistry.findByIdAndUpdate(officer._id, {
    $inc: {
      totalAssigned: 1,
      activeAppointmentCount: 1
    },
    lastAssignedAt: new Date()
  });

  // Update complaint with assigned officer
  complaint.assignedTo = officer.officerId;
  await complaint.save();

  // Send emails in background — do not block response
  sendAppointmentConfirmationEmail(complaint, appointment, officer).catch((err) =>
    console.error('[appointmentService] Worker email failed:', err.message)
  );

  sendAppointmentNotificationToOfficer(complaint, appointment, officer).catch((err) =>
    console.error('[appointmentService] Officer email failed:', err.message)
  );

  return appointment;
};

/**
 * Get all appointments — admin only
 */
const getAllAppointments = async (queryParams) => {
  const {
    page = 1,
    limit = 10,
    status,
    category,
    sortBy = 'scheduledAt',
    order = 'asc'
  } = queryParams;

  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;

  const sortOrder = order === 'asc' ? 1 : -1;
  const skip = (Number(page) - 1) * Number(limit);

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit)),
    Appointment.countDocuments(filter)
  ]);

  return {
    appointments,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  };
};

/**
 * Get appointments for the authenticated worker
 */
const getMyAppointments = async (userId, queryParams) => {
  const { page = 1, limit = 10, status } = queryParams;

  const filter = { workerId: userId };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .sort({ scheduledAt: 1 })
      .skip(skip)
      .limit(Number(limit)),
    Appointment.countDocuments(filter)
  ]);

  return {
    appointments,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  };
};

/**
 * Get appointments assigned to the authenticated legal officer
 */
const getAssignedAppointments = async (officerId, queryParams) => {
  const { page = 1, limit = 10, status } = queryParams;

  const filter = { legalOfficerId: officerId };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .sort({ scheduledAt: 1 })
      .skip(skip)
      .limit(Number(limit)),
    Appointment.countDocuments(filter)
  ]);

  return {
    appointments,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  };
};

/**
 * Get a single appointment by ID
 * Access controlled by role
 */
const getAppointmentById = async (appointmentId, user) => {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  const isWorkerOwner = appointment.workerId.toString() === user.userId;
  const isAssignedOfficer = appointment.legalOfficerId.toString() === user.userId;
  const isAdmin = user.role === 'admin';

  if (!isWorkerOwner && !isAssignedOfficer && !isAdmin) {
    const error = new Error('Access denied. You are not authorized to view this appointment.');
    error.statusCode = 403;
    throw error;
  }

  return appointment;
};

/**
 * Confirm an appointment — admin only
 */
const confirmAppointment = async (appointmentId, { meetingDetails, notes }, user) => {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  if (appointment.status !== 'auto_booked') {
    const error = new Error('Only auto_booked appointments can be confirmed');
    error.statusCode = 400;
    throw error;
  }

  appointment.status = 'confirmed';
  appointment.confirmedAt = new Date();
  if (meetingDetails) appointment.meetingDetails = meetingDetails;
  if (notes) appointment.notes = notes;

  await appointment.save();
  return appointment;
};

/**
 * Reschedule an appointment — admin or assigned legal officer
 */
const rescheduleAppointment = async (appointmentId, { scheduledAt, reason }, user) => {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  if (['completed', 'cancelled'].includes(appointment.status)) {
    const error = new Error('Completed or cancelled appointments cannot be rescheduled');
    error.statusCode = 400;
    throw error;
  }

  // Legal officer can only reschedule their own assigned appointments
  if (user.role === 'lawyer') {
    const isAssigned = appointment.legalOfficerId.toString() === user.userId;
    if (!isAssigned) {
      const error = new Error('Access denied. You can only reschedule appointments assigned to you.');
      error.statusCode = 403;
      throw error;
    }
  }

  // Record the reschedule in history
  appointment.rescheduleHistory.push({
    previousDate: appointment.scheduledAt,
    newDate: new Date(scheduledAt),
    changedBy: user.userId,
    changedByRole: user.role,
    reason: reason || null,
    changedAt: new Date()
  });

  appointment.scheduledAt = new Date(scheduledAt);
  await appointment.save();
  return appointment;
};

/**
 * Cancel an appointment — admin only
 * Also decrements the officer's active appointment count
 */
const cancelAppointment = async (appointmentId, { reason }, user) => {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  if (appointment.status === 'cancelled') {
    const error = new Error('Appointment is already cancelled');
    error.statusCode = 400;
    throw error;
  }

  if (appointment.status === 'completed') {
    const error = new Error('Completed appointments cannot be cancelled');
    error.statusCode = 400;
    throw error;
  }

  appointment.status = 'cancelled';
  appointment.cancelledAt = new Date();
  appointment.cancellationReason = reason || null;

  await appointment.save();

  // Decrement officer's active appointment count
  await LegalOfficerRegistry.findOneAndUpdate(
    { officerId: appointment.legalOfficerId },
    { $inc: { activeAppointmentCount: -1 } }
  );

  return appointment;
};

module.exports = {
  isEligibleForAppointment,
  autoCreateAppointment,
  getAllAppointments,
  getMyAppointments,
  getAssignedAppointments,
  getAppointmentById,
  confirmAppointment,
  rescheduleAppointment,
  cancelAppointment
};