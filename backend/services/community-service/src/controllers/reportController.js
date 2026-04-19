const Report = require('../models/Report');

const ALLOWED_TARGET_TYPES = ['Post', 'Comment', 'UserProfile'];
const ALLOWED_STATUSES     = ['Pending', 'Reviewed', 'Resolved'];

// ── createReport ──────────────────────────────────────────────────────────────
exports.createReport = async (req, res) => {
  try {
    // FIX: was const { reporterId, targetType, targetId, reason } = req.body
    // reporterId from req.body is spoofable — any client can claim to be any user.
    // Now reads reporterId from the verified JWT payload set by protect middleware.
    const reporterId = req.user.userId;                          // FIX: from JWT
    const { targetType, targetId, reason } = req.body;

    if (!ALLOWED_TARGET_TYPES.includes(targetType)) {
      return res.status(400).json({
        message: `Invalid targetType. Must be one of: ${ALLOWED_TARGET_TYPES.join(', ')}`,
      });
    }
    if (!targetId || !reason?.trim()) {
      return res.status(400).json({ message: 'targetId and reason are required' });
    }

    const report = await Report.create({
      reporterId,
      targetType,
      targetId,
      reason,
    });

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error creating report', error: error.message });
  }
};

// ── getReports ────────────────────────────────────────────────────────────────
// Guarded by authorize('admin') in reportRoutes — only admins reach this handler.
exports.getReports = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 20);
    const status = req.query.status;

    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status filter. Must be one of: ${ALLOWED_STATUSES.join(', ')}`,
      });
    }

    const query   = status ? { status } : {};
    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Report.countDocuments(query);
    res.json({ reports, total, page, limit });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reports', error: error.message });
  }
};

// ── updateReportStatus ────────────────────────────────────────────────────────
// Guarded by authorize('admin') in reportRoutes — only admins reach this handler.
exports.updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status }   = req.body;

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}`,
      });
    }

    const report = await Report.findByIdAndUpdate(
      reportId,
      { status },
      { new: true }
    );

    if (!report) return res.status(404).json({ message: 'Report not found' });

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error updating report status', error: error.message });
  }
};