const LegalOfficerRegistry = require('../models/LegalOfficerRegistry');

/**
 * Register a new legal officer into the registry
 * Admin only — must be called after the officer is created in auth-service
 */
const registerOfficer = async (data) => {
  const { officerId, name, email, specializations } = data;

  // Check if officer is already registered
  const existing = await LegalOfficerRegistry.findOne({ officerId });
  if (existing) {
    const error = new Error('This legal officer is already registered');
    error.statusCode = 409;
    throw error;
  }

  const officer = await LegalOfficerRegistry.create({
    officerId,
    name,
    email,
    specializations
  });

  return officer;
};

/**
 * Get all registered legal officers
 * Admin only
 */
const getAllOfficers = async (queryParams) => {
  const {
    page = 1,
    limit = 10,
    specialization,
    isActive,
    sortBy = 'totalAssigned',
    order = 'desc'
  } = queryParams;

  const filter = {};
  if (specialization) filter.specializations = specialization;

  // Handle isActive filter — query param comes in as string
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }

  const sortOrder = order === 'asc' ? 1 : -1;
  const skip = (Number(page) - 1) * Number(limit);

  const [officers, total] = await Promise.all([
    LegalOfficerRegistry.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit)),
    LegalOfficerRegistry.countDocuments(filter)
  ]);

  return {
    officers,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  };
};

/**
 * Get a single officer from the registry by their officerId
 */
const getOfficerById = async (officerId) => {
  const officer = await LegalOfficerRegistry.findOne({ officerId });

  if (!officer) {
    const error = new Error('Legal officer not found in registry');
    error.statusCode = 404;
    throw error;
  }

  return officer;
};

/**
 * Update officer specializations or active status
 * Admin only
 */
const updateOfficer = async (officerId, data) => {
  const officer = await LegalOfficerRegistry.findOne({ officerId });

  if (!officer) {
    const error = new Error('Legal officer not found in registry');
    error.statusCode = 404;
    throw error;
  }

  const allowedUpdates = ['specializations', 'isActive', 'name', 'email'];
  allowedUpdates.forEach((field) => {
    if (data[field] !== undefined) {
      officer[field] = data[field];
    }
  });

  await officer.save();
  return officer;
};

/**
 * Remove an officer from the registry — admin only
 * Soft delete by setting isActive to false
 * Hard delete only if they have no appointments
 */
const deactivateOfficer = async (officerId) => {
  const officer = await LegalOfficerRegistry.findOne({ officerId });

  if (!officer) {
    const error = new Error('Legal officer not found in registry');
    error.statusCode = 404;
    throw error;
  }

  if (!officer.isActive) {
    const error = new Error('Officer is already deactivated');
    error.statusCode = 400;
    throw error;
  }

  officer.isActive = false;
  await officer.save();

  return officer;
};

/**
 * Get registry stats — useful for admin dashboard
 */
const getRegistryStats = async () => {
  const [specializationStats, activeCount, totalCount] = await Promise.all([
    // Count officers per specialization
    LegalOfficerRegistry.aggregate([
      { $unwind: '$specializations' },
      { $group: { _id: '$specializations', count: { $sum: 1 } } }
    ]),
    LegalOfficerRegistry.countDocuments({ isActive: true }),
    LegalOfficerRegistry.countDocuments()
  ]);

  const bySpecialization = specializationStats.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  return {
    totalOfficers: totalCount,
    activeOfficers: activeCount,
    bySpecialization
  };
};

module.exports = {
  registerOfficer,
  getAllOfficers,
  getOfficerById,
  updateOfficer,
  deactivateOfficer,
  getRegistryStats
};