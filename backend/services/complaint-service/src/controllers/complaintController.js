const complaintService = require('../services/complaintService');

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
  generateReport
};