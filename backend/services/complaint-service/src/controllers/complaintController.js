const complaintService = require('../services/complaintService');
const Complaint = require('../models/Complaint');
const { emitEvent } = require('../utils/kafkaProducer');
const { COMPLAINT_EVENTS, TOPICS } = require('../utils/eventTypes');

/**
 * @desc    File a new complaint
 * @route   POST /api/complaints
 * @access  Private (worker)
 */
const createComplaint = async (req, res, next) => {
  try {
    const attachments = (req.files || []).map((file) => ({
      url: file.path,
      fileType: file.mimetype.startsWith('image/') ? 'image' : 'document',
      originalName: file.originalname,
      uploadedAt: new Date()
    }));

    const complaint = await complaintService.createComplaint(
      {
        ...req.body,
        attachments
      },
      req.user
    );

    res.status(201).json({
      success: true,
      message: 'Complaint filed successfully. You will receive a confirmation email shortly.',
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all complaints with filters, search, and pagination
 * @route   GET /api/complaints
 * @access  Private (admin, lawyer)
 */
const getAllComplaints = async (req, res, next) => {
  try {
    const result = await complaintService.getAllComplaints(req.query);

    res.status(200).json({
      success: true,
      data: result.complaints,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get complaints filed by the authenticated worker
 * @route   GET /api/complaints/my
 * @access  Private (worker)
 */
const getMyComplaints = async (req, res, next) => {
  try {
    const result = await complaintService.getMyComplaints(req.user.userId, req.query);

    res.status(200).json({
      success: true,
      data: result.complaints,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single complaint by ID
 * @route   GET /api/complaints/:id
 * @access  Private (worker — own only, admin, lawyer)
 */
const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await complaintService.getComplaintById(req.params.id, req.user);

    res.status(200).json({
      success: true,
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a complaint (worker edits their own pending complaint)
 * @route   PATCH /api/complaints/:id
 * @access  Private (worker — own pending only)
 */
const updateComplaint = async (req, res, next) => {
  try {
    const complaint = await complaintService.updateComplaint(
      req.params.id,
      req.body,
      req.user
    );

    res.status(200).json({
      success: true,
      message: 'Complaint updated successfully.',
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update complaint status with reason and audit trail
 * @route   PATCH /api/complaints/:id/status
 * @access  Private (admin, legal_officer)
 */
const updateComplaintStatus = async (req, res, next) => {
  try {
    const complaint = await complaintService.updateComplaintStatus(
      req.params.id,
      req.body,
      req.user
    );

    res.status(200).json({
      success: true,
      message: `Complaint status updated to "${req.body.status}".`,
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign a complaint to a legal officer
 * @route   PATCH /api/complaints/:id/assign
 * @access  Private (admin only)
 */
const assignComplaint = async (req, res, next) => {
  try {
    const complaint = await complaintService.assignComplaint(
      req.params.id,
      req.body.officerId,
      req.user
    );

    res.status(200).json({
      success: true,
      message: 'Complaint assigned to legal officer successfully.',
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a complaint
 * @route   DELETE /api/complaints/:id
 * @access  Private (worker — own pending only, admin — any)
 */
const deleteComplaint = async (req, res, next) => {
  try {
    await complaintService.deleteComplaint(req.params.id, req.user);

    res.status(200).json({
      success: true,
      message: 'Complaint deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get complaint dashboard statistics
 * @route   GET /api/complaints/stats
 * @access  Private (admin, legal_officer)
 */
const getComplaintStats = async (req, res, next) => {
  try {
    const stats = await complaintService.getComplaintStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload an attachment/evidence for a complaint
 * @route   POST /api/complaints/:id/attachments
 * @access  Private (worker - owner, admin)
 */
const uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      const error = new Error('No file uploaded');
      error.statusCode = 400;
      throw error;
    }

    const complaint = await complaintService.addAttachment(
      req.params.id,
      req.file,
      req.user
    );

    res.status(200).json({
      success: true,
      message: 'Attachment uploaded successfully.',
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate and download a PDF report for a complaint
 * @route   GET /api/complaints/:id/report
 * @access  Private (authenticated users with access)
 */
const generateReport = async (req, res, next) => {
  try {
    const { generateComplaintPDF } = require('../utils/pdfGenerator');
    const complaint = await complaintService.getComplaintById(req.params.id, req.user);

    generateComplaintPDF(complaint, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Share a resolved/rejected complaint anonymously to the community
 * @route   POST /api/complaints/:id/share-to-community
 * @access  Private (filer only)
 *
 * PII handling: allowlist approach — only title, description, category, and
 * location.district are published. workerId, organizationName, city, and
 * attachments are stripped. sharedToCommunityAt prevents re-sharing.
 */
/**
 * @desc    Generate an NGO impact report PDF (aggregated over filters)
 * @route   GET /api/complaints/ngo-report
 * @access  Private (ngo, admin)
 */
const generateNgoImpactReport = async (req, res, next) => {
  try {
    const { generateNgoReport } = require('../utils/pdfGenerator');

    const matchFilter = {};
    if (req.query.category) matchFilter.category = req.query.category;
    if (req.query.status) matchFilter.status = req.query.status;
    if (req.query.from || req.query.to) {
      matchFilter.createdAt = {};
      if (req.query.from) matchFilter.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) matchFilter.createdAt.$lte = new Date(req.query.to);
    }

    const [total, byStatus, byCategory, complaints] = await Promise.all([
      Complaint.countDocuments(matchFilter),
      Complaint.aggregate([{ $match: matchFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $match: matchFilter }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
      Complaint.find(matchFilter)
        .sort({ createdAt: -1 })
        .limit(50)
        .select('title category status priority location createdAt')
        .lean(),
    ]);

    const statusMap = byStatus.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {});

    const payload = {
      summary: {
        total,
        pending: statusMap.pending || 0,
        underReview: statusMap.under_review || 0,
        inProgress: statusMap.in_progress || 0,
        resolved: statusMap.resolved || 0,
        rejected: statusMap.rejected || 0,
        resolutionRate: total > 0 ? Math.round(((statusMap.resolved || 0) / total) * 100) : 0,
      },
      byStatus,
      byCategory,
      complaints,
      filters: req.query,
    };

    generateNgoReport(payload, res);
  } catch (error) {
    next(error);
  }
};

// ── NGO monitoring endpoints (N6/N7) ─────────────────────────────────────────

const monitorComplaint = async (req, res, next) => {
  try {
    const complaint = await complaintService.monitorComplaint(req.params.id, req.user._id || req.user.userId);
    res.json({
      success: true,
      message: 'Complaint added to your monitored cases.',
      data: complaint,
    });
  } catch (error) { next(error); }
};

const unmonitorComplaint = async (req, res, next) => {
  try {
    const complaint = await complaintService.unmonitorComplaint(req.params.id, req.user._id || req.user.userId);
    res.json({
      success: true,
      message: 'Complaint removed from your monitored cases.',
      data: complaint,
    });
  } catch (error) { next(error); }
};

const getMonitoredComplaints = async (req, res, next) => {
  try {
    const result = await complaintService.getMonitoredComplaints(req.user._id || req.user.userId, req.query);
    res.json({ success: true, data: result.complaints, pagination: result.pagination });
  } catch (error) { next(error); }
};

const getNgoScopedStats = async (req, res, next) => {
  try {
    const stats = await complaintService.getNgoScopedStats(req.user._id || req.user.userId);
    res.json({ success: true, data: stats });
  } catch (error) { next(error); }
};

const shareToCommunity = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }
    if (complaint.workerId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only the filer can share this case' });
    }
    if (!['resolved', 'rejected'].includes(complaint.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only resolved or rejected cases can be shared to the community',
      });
    }
    if (complaint.sharedToCommunityAt) {
      return res.status(409).json({ success: false, message: 'This case has already been shared' });
    }

    complaint.sharedToCommunityAt = new Date();
    await complaint.save();

    // Publish only whitelisted fields. Anything else stays private.
    emitEvent(TOPICS.COMPLAINT, COMPLAINT_EVENTS.COMPLAINT_SHARED_TO_COMMUNITY, {
      title: complaint.title,
      description: complaint.description,
      category: complaint.category,
      district: complaint.location?.district || '',
      status: complaint.status,
      complaintId: complaint._id,
    });

    res.json({ success: true, message: 'Shared anonymously to the community' });
  } catch (error) {
    next(error);
  }
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
  uploadAttachment,
  generateReport,
  shareToCommunity,
  generateNgoImpactReport,
  monitorComplaint,
  unmonitorComplaint,
  getMonitoredComplaints,
  getNgoScopedStats
};