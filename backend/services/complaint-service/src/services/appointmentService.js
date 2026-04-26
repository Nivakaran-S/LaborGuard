const Appointment = require('../models/Appointment');
const Complaint = require('../models/Complaint');
const LegalOfficerRegistry = require('../models/LegalOfficerRegistry');
const { sendAppointmentConfirmationEmail, sendAppointmentNotificationToOfficer } = require('./emailService');
const { emitEvent } = require('../utils/kafkaProducer');

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

// Business-hour helpers used by getNextAvailableSlot.
const BUSINESS_START_HOUR = 9;
const BUSINESS_END_HOUR   = 17;            // last meeting starts at 16:00, ends 17:00
const SLOT_HOURS          = 1;             // book in 1-hour grid slots

const skipWeekend = (d) => {
  // 0 = Sunday, 6 = Saturday
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
};

/**
 * Next available appointment slot for a specific officer.
 *
 * Walks forward in 1-hour increments from "tomorrow at 9 AM", skipping
 * weekends and any slot the officer already has booked (auto_booked /
 * confirmed only — cancelled / completed don't block). Without this
 * collision check, every auto-appointment created in the same minute would
 * land at the same 9 AM tomorrow slot for the same officer, which is
 * obviously unrunnable.
 *
 * Async because we hit Mongo for the officer's existing reservations.
 */
const getNextAvailableSlot = async (officerId = null) => {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  skipWeekend(start);
  start.setHours(BUSINESS_START_HOUR, 0, 0, 0);

  // No officer context (e.g. worker-requested appointment with no assigned
  // officer yet) → return the first 9 AM slot. Admin resolves collisions
  // on confirm.
  if (!officerId) return start;

  const horizon = new Date(start);
  horizon.setDate(horizon.getDate() + 21);

  const taken = await Appointment.find(
    {
      legalOfficerId: officerId,
      status: { $in: ['auto_booked', 'confirmed'] },
      scheduledAt: { $gte: start, $lte: horizon },
    },
    { scheduledAt: 1 }
  ).lean();

  const takenStamps = new Set(taken.map((a) => new Date(a.scheduledAt).getTime()));

  const cursor = new Date(start);
  // Bound the search — 14 working days × 8 slots/day = 112 candidates.
  for (let i = 0; i < 200; i += 1) {
    if (!takenStamps.has(cursor.getTime())) return new Date(cursor);

    cursor.setHours(cursor.getHours() + SLOT_HOURS);
    if (cursor.getHours() >= BUSINESS_END_HOUR) {
      cursor.setDate(cursor.getDate() + 1);
      skipWeekend(cursor);
      cursor.setHours(BUSINESS_START_HOUR, 0, 0, 0);
    }
  }
  // Fallback — every slot in the horizon is taken. Land on the first slot
  // anyway; admin can reschedule.
  return start;
};

/**
 * Auto-create an appointment when admin approves a complaint
 * Called from complaintService.updateComplaintStatus
 */
const autoCreateAppointment = async (complaint, adminUser) => {
  const specialization = CATEGORY_SPECIALIZATION_MAP[complaint.category];

  // Pick the best available legal officer via round robin
  const officer = await assignLegalOfficer(specialization);
  const scheduledAt = await getNextAvailableSlot(officer.officerId);

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

  // Fire an in-app notification event for both worker and officer. Without
  // this, no bell badge ever lights up on auto-booking — only emails fire,
  // and emails depend on the Resend domain being verified.
  emitEvent('complaint-events', 'appointment_auto_booked', {
    appointmentId: appointment._id,
    complaintId  : complaint._id,
    workerId     : complaint.workerId,
    officerId    : officer.officerId,
    title        : complaint.title,
    scheduledAt  : appointment.scheduledAt,
    category     : complaint.category,
  }).catch((err) =>
    console.error('[appointmentService] event emit failed:', err.message)
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
  // legalOfficerId can be null for `requested` appointments awaiting admin
  // confirmation — guard before calling toString().
  const isAssignedOfficer =
    appointment.legalOfficerId != null &&
    appointment.legalOfficerId.toString() === user.userId;
  const isAdmin = user.role === 'admin';

  if (!isWorkerOwner && !isAssignedOfficer && !isAdmin) {
    const error = new Error('Access denied. You are not authorized to view this appointment.');
    error.statusCode = 403;
    throw error;
  }

  return appointment;
};

/**
 * Confirm an appointment — admin only.
 *
 * Accepts either an `auto_booked` appointment (no extra fields needed) or a
 * worker-`requested` appointment (admin must supply `legalOfficerId` since
 * requested appointments don't carry one yet — see Appointment.legalOfficerId
 * conditional validator).
 */
const confirmAppointment = async (
  appointmentId,
  { meetingDetails, notes, legalOfficerId },
  user
) => {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  if (!['auto_booked', 'requested'].includes(appointment.status)) {
    const error = new Error('Only auto_booked or requested appointments can be confirmed');
    error.statusCode = 400;
    throw error;
  }

  if (appointment.status === 'requested') {
    if (!legalOfficerId) {
      const error = new Error('legalOfficerId is required when confirming a requested appointment');
      error.statusCode = 400;
      throw error;
    }
    appointment.legalOfficerId = legalOfficerId;
    // Bump the registry counters now that this officer is actually committed.
    await LegalOfficerRegistry.findOneAndUpdate(
      { officerId: legalOfficerId },
      { $inc: { totalAssigned: 1, activeAppointmentCount: 1 }, lastAssignedAt: new Date() }
    );
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

/**
 * Worker requests an appointment for their own complaint (W20).
 * Creates an appointment with status='requested'; admin must confirm later.
 * No officer is auto-assigned on request — the complaint may not yet be eligible
 * for auto-booking. Admin will assign on confirmation.
 */
const requestAppointment = async ({ complaintId, preferredDate, reason }, user) => {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    const error = new Error('Complaint not found');
    error.statusCode = 404;
    throw error;
  }
  if (complaint.workerId.toString() !== user.userId) {
    const error = new Error('You can only request appointments for your own complaints');
    error.statusCode = 403;
    throw error;
  }

  // Don't request for closed cases
  if (['resolved', 'rejected'].includes(complaint.status)) {
    const error = new Error('Cannot request an appointment for a closed case');
    error.statusCode = 400;
    throw error;
  }

  // Prevent spam: at most one pending request per complaint
  const existing = await Appointment.findOne({
    complaintId,
    workerId: user.userId,
    status: { $in: ['requested', 'auto_booked', 'confirmed'] }
  });
  if (existing) {
    const error = new Error('An appointment already exists for this complaint');
    error.statusCode = 409;
    throw error;
  }

  const specialization = {
    wage_theft: 'labor_law',
    wrongful_termination: 'labor_law',
    harassment: 'harassment_law',
    discrimination: 'discrimination_law',
  }[complaint.category] || 'labor_law';

  // If admin already linked an officer to the complaint, honour that for
  // collision-aware slot picking. Otherwise the slot picker returns the
  // first 9 AM and admin reschedules at confirm time.
  const presetOfficer = complaint.assignedTo || null;
  const scheduledAt = preferredDate
    ? new Date(preferredDate)
    : await getNextAvailableSlot(presetOfficer);

  const appointment = await Appointment.create({
    complaintId: complaint._id,
    workerId: complaint.workerId,
    // Was: complaint.assignedTo || complaint.workerId — using the worker's
    // own id as a fake officer is semantically wrong and pollutes the
    // lawyer's "assigned cases" view. Now nullable for `requested` status.
    legalOfficerId: presetOfficer,
    category: ['wage_theft', 'wrongful_termination', 'harassment', 'discrimination']
      .includes(complaint.category) ? complaint.category : 'wage_theft',
    specialization,
    scheduledAt,
    status: 'requested',
    meetingType: 'online',
    notes: reason ? `Worker-requested: ${reason}` : 'Worker-requested appointment'
  });

  // Tell admin a request needs confirmation. Fire-and-forget so a
  // notification-service blip doesn't break the worker's request flow.
  emitEvent('complaint-events', 'appointment_requested', {
    appointmentId: appointment._id,
    complaintId  : complaint._id,
    workerId     : complaint.workerId,
    title        : complaint.title,
    scheduledAt  : appointment.scheduledAt,
  }).catch((err) =>
    console.error('[appointmentService] event emit failed:', err.message)
  );

  return appointment;
};

/**
 * Assigned legal officer records post-meeting outcome notes (L5).
 * Sets outcomeNotes + timestamp + recorder. Optionally marks appointment completed.
 */
const recordAppointmentOutcome = async (appointmentId, { outcomeNotes, markCompleted }, user) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  const isAssigned = appointment.legalOfficerId.toString() === user.userId;
  const isAdmin = user.role === 'admin';
  if (!isAssigned && !isAdmin) {
    const error = new Error('Only the assigned legal officer or an admin can record outcomes');
    error.statusCode = 403;
    throw error;
  }

  if (appointment.status === 'cancelled') {
    const error = new Error('Cannot record outcome on a cancelled appointment');
    error.statusCode = 400;
    throw error;
  }

  if (!outcomeNotes?.trim()) {
    const error = new Error('outcomeNotes is required');
    error.statusCode = 400;
    throw error;
  }

  appointment.outcomeNotes = outcomeNotes.trim();
  appointment.outcomeRecordedAt = new Date();
  appointment.outcomeRecordedBy = user.userId;
  if (markCompleted === true && appointment.status !== 'completed') {
    appointment.status = 'completed';
    // Decrement officer load when a meeting is finalised
    await LegalOfficerRegistry.findOneAndUpdate(
      { officerId: appointment.legalOfficerId },
      { $inc: { activeAppointmentCount: -1 } }
    );
  }

  await appointment.save();
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
  cancelAppointment,
  requestAppointment,
  recordAppointmentOutcome
};