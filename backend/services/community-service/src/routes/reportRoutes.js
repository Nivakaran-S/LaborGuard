const express = require('express');
const router  = express.Router();
const reportController         = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);


router.get('/',              authorize('admin'), reportController.getReports);
router.put('/:id/status',    authorize('admin'), reportController.updateReportStatus);

module.exports = router;