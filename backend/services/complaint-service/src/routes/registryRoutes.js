const express = require('express');
const router = express.Router();

const registryController = require('../controllers/registryController');
const { authenticate, authorize } = require('../middleware/auth');
const {
  validate,
  validateOfficerObjectId,
  registerOfficerRules,
  updateOfficerRules,
  listRegistryRules
} = require('../utils/validator');

// GET /api/registry/stats
router.get('/stats', authenticate, authorize('admin'), registryController.getRegistryStats);

// GET /api/registry
router.get('/', authenticate, authorize('admin'), listRegistryRules, validate, registryController.getAllOfficers);

// POST /api/registry
router.post('/', authenticate, authorize('admin'), registerOfficerRules, validate, registryController.registerOfficer);

// GET /api/registry/:officerId
router.get('/:officerId', authenticate, authorize('admin'), validateOfficerObjectId, validate, registryController.getOfficerById);

// PATCH /api/registry/:officerId
router.patch('/:officerId', authenticate, authorize('admin'), validateOfficerObjectId, updateOfficerRules, validate, registryController.updateOfficer);

// PATCH /api/registry/:officerId/deactivate
router.patch('/:officerId/deactivate', authenticate, authorize('admin'), validateOfficerObjectId, validate, registryController.deactivateOfficer);

module.exports = router;