const express = require('express');
const {
    createJob,
    getJobs,
    getJobById,
    updateJob,
    deleteJob,
    applyToJob,
    getWorkerApplications,
    getEmployerApplications,
    getEmployerJobs,
    getJobApplications,
    updateApplicationStatus
} = require('../controllers/jobController');

const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
    .get(getJobs)                                                            // Public
    .post(protect, authorize('employer', 'admin'), createJob);               // Employers post jobs

router.get('/my-applications', protect, getWorkerApplications); // Workers view their own apps
router.get('/employer/applications', protect, authorize('employer', 'admin'), getEmployerApplications); // Employers view applicants
// FIX: added /my-listings so employers can fetch their own job postings
// Frontend: jobApi.getEmployerJobs() → GET /api/jobs/my-listings
router.get('/my-listings', protect, authorize('employer', 'admin'), getEmployerJobs);

router.get('/my-applications', protect, getWorkerApplications);              // Workers view their own apps

router.route('/:id')
    .get(getJobById)
    .put(protect, authorize('employer', 'admin'), updateJob)
    .delete(protect, authorize('employer', 'admin'), deleteJob);

router.get('/:id/applications', protect, authorize('employer', 'admin'), getJobApplications);
router.post('/:id/apply', protect, authorize('worker'), applyToJob);
router.put('/applications/:appId/status', protect, authorize('employer', 'admin'), updateApplicationStatus);

module.exports = router;