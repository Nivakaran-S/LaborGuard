const registryService = require('../services/registryService');

/**
 * @desc    Register a legal officer into the registry
 * @route   POST /api/registry
 * @access  Private (admin only)
 */
const registerOfficer = async (req, res, next) => {
  try {
    const officer = await registryService.registerOfficer(req.body);

    res.status(201).json({
      success: true,
      message: 'Legal officer registered successfully.',
      data: officer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all registered legal officers
 * @route   GET /api/registry
 * @access  Private (admin only)
 */
const getAllOfficers = async (req, res, next) => {
  try {
    const result = await registryService.getAllOfficers(req.query);

    res.status(200).json({
      success: true,
      data: result.officers,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get registry statistics
 * @route   GET /api/registry/stats
 * @access  Private (admin only)
 */
const getRegistryStats = async (req, res, next) => {
  try {
    const stats = await registryService.getRegistryStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single legal officer from registry
 * @route   GET /api/registry/:officerId
 * @access  Private (admin only)
 */
const getOfficerById = async (req, res, next) => {
  try {
    const officer = await registryService.getOfficerById(req.params.officerId);

    res.status(200).json({
      success: true,
      data: officer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a legal officer's specializations or details
 * @route   PATCH /api/registry/:officerId
 * @access  Private (admin only)
 */
const updateOfficer = async (req, res, next) => {
  try {
    const officer = await registryService.updateOfficer(req.params.officerId, req.body);

    res.status(200).json({
      success: true,
      message: 'Legal officer updated successfully.',
      data: officer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Deactivate a legal officer from the registry
 * @route   PATCH /api/registry/:officerId/deactivate
 * @access  Private (admin only)
 */
const deactivateOfficer = async (req, res, next) => {
  try {
    const officer = await registryService.deactivateOfficer(req.params.officerId);

    res.status(200).json({
      success: true,
      message: 'Legal officer deactivated successfully.',
      data: officer
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerOfficer,
  getAllOfficers,
  getRegistryStats,
  getOfficerById,
  updateOfficer,
  deactivateOfficer
};