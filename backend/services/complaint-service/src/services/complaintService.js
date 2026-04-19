const Complaint = require('../models/Complaint');
const { sendComplaintConfirmationEmail, sendStatusUpdateEmail } = require('./emailService');
const { isEligibleForAppointment, autoCreateAppointment } = require('./appointmentService');
const { emitEvent } = require('../utils/kafkaProducer');

// Create a new complaint filed by a worker
const createComplaint = async (data, user) => {
  const complaint = await Complaint.create({
    ...data,
    workerId: user.userId
  });

  // Send confirmation email in background — do not block response
  sendComplaintConfirmationEmail(user.email, user.name, complaint).catch((err) =>
    console.error('[complaint-service] Email send failed:', err.message)
  );

  return complaint;
};

// Get all complaints — admin only
// Supports filtering, searching, sorting, and pagination
const getAllComplaints = async (queryParams) => {
  const {
    page = 1,
    limit = 10,
    status,
    category,
    priority,
    assignedTo,
    search,
    sortBy = 'createdAt',
    order = 'desc'
  } = queryParams;

  const filter = {};

  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assignedTo = assignedTo;

  // Full-text search on title and description
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { organizationName: { $regex: search, $options: 'i' } }
    ];
  }

  const sortOrder = order === 'asc' ? 1 : -1;
  const skip = (Number(page) - 1) * Number(limit);

  const [complaints, total] = await Promise.all([
    Complaint.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit))
      .select('-statusHistory'), // exclude heavy field from list view
    Complaint.countDocuments(filter)
  ]);

  return {
    complaints,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  };
};

// Get complaints filed by the authenticated worker only
const getMyComplaints = async (userId, queryParams) => {
  const {
    page = 1,
    limit = 10,
    status,
    category,
    sortBy = 'createdAt',
    order = 'desc'
  } = queryParams;

  const filter = { workerId: userId };

  if (status) filter.status = status;
  if (category) filter.category = category;

  const sortOrder = order === 'asc' ? 1 : -1;
  const skip = (Number(page) - 1) * Number(limit);

  const [complaints, total] = await Promise.all([
    Complaint.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit)),
    Complaint.countDocuments(filter)
  ]);

  return {
    complaints,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  };
};

// Get a single complaint by ID
// Workers can only view their own complaints
// Admins can view any complaint
const getComplaintById = async (complaintId, user) => {
  const complaint = await Complaint.findById(complaintId);

  if (!complaint) {
    const error = new Error('Complaint not found');
    error.statusCode = 404;
    throw error;
  }

  const isOwner = complaint.workerId.toString() === user.userId;
  const isAssigned = complaint.assignedTo?.toString() === user.userId;
  const isPrivileged = user.role === 'admin' || (user.role === 'lawyer' && isAssigned) || user.role === 'ngo';

  if (!isOwner && !isPrivileged) {
    const error = new Error('Access denied. You can only view your own complaints.');
    error.statusCode = 403;
    throw error;
  }

  return complaint;
};

// Update a complaint — workers can only edit their own pending complaints
const updateComplaint = async (complaintId, data, user) => {
  const complaint = await Complaint.findById(complaintId);

  if (!complaint) {
    const error = new Error('Complaint not found');
    error.statusCode = 404;
    throw error;
  }

  const isOwner = complaint.workerId.toString() === user.userId;

  if (!isOwner) {
    const error = new Error('Access denied. You can only edit your own complaints.');
    error.statusCode = 403;
    throw error;
  }

  if (complaint.status !== 'pending') {
    const error = new Error('Only pending complaints can be edited.');
    error.statusCode = 400;
    throw error;
  }

  // Only allow specific fields to be updated by the worker
  const allowedUpdates = [
    'title',
    'description',
    'category',
    'priority',
    'organizationName',
    'location'
  ];

  allowedUpdates.forEach((field) => {
    if (data[field] !== undefined) {
      complaint[field] = data[field];
    }
  });

  await complaint.save();
  return complaint;
};

// Update complaint status — admin & assigned legal_officer only
// Records a full audit trail in statusHistory
const updateComplaintStatus = async (complaintId, { status, reason }, user) => {
  const complaint = await Complaint.findById(complaintId);

  if (user.role === 'lawyer') {
    const isAssigned = complaint.assignedTo?.toString() === user.userId;
    if (!isAssigned) {
      const error = new Error('Access denied. You can only update status of complaints assigned to you.');
      error.statusCode = 403;
      throw error;
    }
  }
  if (!complaint) {
    const error = new Error('Complaint not found');
    error.statusCode = 404;
    throw error;
  }

  const previousStatus = complaint.status;
  complaint.status = status;

  // Record the status change in audit trail
  complaint.statusHistory.push({
    status,
    changedBy: user.userId,
    changedByRole: user.role,
    reason: reason || null,
    changedAt: new Date()
  });

  // Set resolvedAt timestamp when complaint is closed
  if (status === 'resolved' || status === 'rejected') {
    complaint.resolvedAt = new Date();
  }

  await complaint.save();

  // Notify worker of status change via email in background
  sendStatusUpdateEmail(complaint, previousStatus, status).catch((err) =>
    console.error('[complaint-service] Status update email failed:', err.message)
  );

  // Auto-book appointment if complaint meets criteria
  if (status === 'under_review' && isEligibleForAppointment(complaint.category, complaint.priority)) {
    autoCreateAppointment(complaint, user).catch((err) =>
      console.error('[complaint-service] Auto-booking failed:', err.message)
    );
  }

  // Emit Kafka event strictly for UI Notification generation
  emitEvent('complaint-events', 'complaint_status_updated', {
    complaintId: complaint._id,
    workerId: complaint.workerId,
    newStatus: status,
    title: complaint.title
  }).catch((err) => console.error('[complaint-service] Kafka emit failed:', err.message));

  return complaint;
};

// Assign a complaint to a legal officer — admin only
const assignComplaint = async (complaintId, officerId, user) => {
  const complaint = await Complaint.findById(complaintId);

  if (!complaint) {
    const error = new Error('Complaint not found');
    error.statusCode = 404;
    throw error;
  }

  complaint.assignedTo = officerId;

  // Automatically move to under_review when assigned
  if (complaint.status === 'pending') {
    complaint.status = 'under_review';
    complaint.statusHistory.push({
      status: 'under_review',
      changedBy: user.userId,
      changedByRole: user.role,
      reason: 'Assigned to legal officer',
      changedAt: new Date()
    });
  }

  await complaint.save();

  // Emit Kafka event to notify the assigned officer
  emitEvent('complaint-events', 'complaint_assigned', {
    complaintId: complaint._id,
    officerId: officerId,
    workerId: complaint.workerId,
    title: complaint.title
  }).catch((err) => console.error('[complaint-service] Kafka emit failed:', err.message));

  return complaint;
};

// Delete a complaint
// Workers can only delete their own pending complaints
// Admins can delete any complaint
const deleteComplaint = async (complaintId, user) => {
  const complaint = await Complaint.findById(complaintId);

  if (!complaint) {
    const error = new Error('Complaint not found');
    error.statusCode = 404;
    throw error;
  }

  const isOwner = complaint.workerId.toString() === user.userId;
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    const error = new Error('Access denied. You cannot delete this complaint.');
    error.statusCode = 403;
    throw error;
  }

  if (isOwner && !isAdmin && complaint.status !== 'pending') {
    const error = new Error('You can only delete complaints that are still pending.');
    error.statusCode = 400;
    throw error;
  }

  await complaint.deleteOne();
};

// Get dashboard statistics — admin & legal_officer only
const getComplaintStats = async () => {
  const [statusStats, categoryStats, priorityStats, recentCount] = await Promise.all([
    // Count by status
    Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    // Count by category
    Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]),
    // Count by priority
    Complaint.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]),
    // Complaints filed in the last 30 days
    Complaint.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    })
  ]);

  const format = (arr) =>
    arr.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

  return {
    byStatus: format(statusStats),
    byCategory: format(categoryStats),
    byPriority: format(priorityStats),
    recentComplaints: recentCount,
    total: await Complaint.countDocuments()
  };
};

//Add an attachment to a complaint
const addAttachment = async (complaintId, fileData, user) => {
  const complaint = await Complaint.findById(complaintId);

  if (!complaint) {
    const error = new Error('Complaint not found');
    error.statusCode = 404;
    throw error;
  }

  // Authorization: Only owner can add attachments to pending/under_review
  // Admins can add anytime
  const isOwner = complaint.workerId.toString() === user.userId;
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    const error = new Error('Access denied. You cannot add attachments to this complaint.');
    error.statusCode = 403;
    throw error;
  }

  if (isOwner && !['pending', 'under_review'].includes(complaint.status)) {
    const error = new Error('Evidence can only be uploaded for complaints that are pending or under review.');
    error.statusCode = 400;
    throw error;
  }

  complaint.attachments.push({
    url: fileData.path,
    fileType: fileData.mimetype.startsWith('image/') ? 'image' : 'document',
    originalName: fileData.originalname,
    uploadedAt: new Date()
  });

  await complaint.save();
  return complaint;
};

module.exports = {
  createComplaint,
  getAllComplaints,
  getMyComplaints,
  getComplaintById,
  updateComplaint,
  updateComplaintStatus,
  assignComplaint,
  deleteComplaint,
  getComplaintStats,
  addAttachment
};