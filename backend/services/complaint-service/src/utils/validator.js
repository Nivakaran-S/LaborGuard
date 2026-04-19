const { body, param, query, validationResult } = require('express-validator');

// ─────────────────────────────────────────────
// Core Validate Middleware
// ─────────────────────────────────────────────

/**
 * Reusable middleware to check validation results.
 * Place this after any validation chain in a route.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg
      }))
    });
  }

  next();
};

// ─────────────────────────────────────────────
// Shared
// ─────────────────────────────────────────────

/**
 * Validate MongoDB ObjectId in URL params (:id)
 */
const validateObjectId = [
  param('id')
    .isMongoId().withMessage('Invalid ID format')
];

/**
 * Validate MongoDB ObjectId in URL params (:officerId)
 */
const validateOfficerObjectId = [
  param('officerId')
    .isMongoId().withMessage('Invalid officer ID format')
];

// ─────────────────────────────────────────────
// Complaint Rules
// ─────────────────────────────────────────────

const createComplaintRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 10 }).withMessage('Title must be at least 10 characters')
    .isLength({ max: 150 }).withMessage('Title cannot exceed 150 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 30 }).withMessage('Description must be at least 30 characters')
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),

  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn([
      'wage_theft',
      'unsafe_conditions',
      'wrongful_termination',
      'harassment',
      'discrimination',
      'unpaid_overtime',
      'other'
    ]).withMessage('Invalid category'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be one of: low, medium, high, critical'),

  body('organizationName')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Organization name cannot exceed 200 characters'),

  body('location.city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('City name too long'),

  body('location.district')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('District name too long'),

  body('isAnonymous')
    .optional()
    .isBoolean().withMessage('isAnonymous must be true or false')
];

const updateComplaintRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 10 }).withMessage('Title must be at least 10 characters')
    .isLength({ max: 150 }).withMessage('Title cannot exceed 150 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 30 }).withMessage('Description must be at least 30 characters')
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),

  body('category')
    .optional()
    .isIn([
      'wage_theft',
      'unsafe_conditions',
      'wrongful_termination',
      'harassment',
      'discrimination',
      'unpaid_overtime',
      'other'
    ]).withMessage('Invalid category'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be one of: low, medium, high, critical'),

  body('organizationName')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Organization name cannot exceed 200 characters'),

  body('location.city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('City name too long'),

  body('location.district')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('District name too long')
];

const updateStatusRules = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['pending', 'under_review', 'resolved', 'rejected'])
    .withMessage('Invalid status value'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
];

const assignComplaintRules = [
  body('officerId')
    .notEmpty().withMessage('Officer ID is required')
    .isMongoId().withMessage('Invalid officer ID format')
];

const listComplaintsRules = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

  query('status')
    .optional()
    .custom((value) => {
      if (value === '') return true; // Allow empty string
      return ['pending', 'under_review', 'resolved', 'rejected'].includes(value);
    })
    .withMessage('Invalid status filter'),

  query('category')
    .optional()
    .custom((value) => {
      if (value === '') return true; // Allow empty string
      return [
        'wage_theft',
        'unsafe_conditions',
        'wrongful_termination',
        'harassment',
        'discrimination',
        'unpaid_overtime',
        'other'
      ].includes(value);
    })
    .withMessage('Invalid category filter'),

  query('priority')
    .optional()
    .custom((value) => {
      if (value === '') return true; // Allow empty string
      return ['low', 'medium', 'high', 'critical'].includes(value);
    })
    .withMessage('Invalid priority filter'),

  query('sortBy')
    .optional()
    .custom((value) => {
      if (value === '') return true; // Allow empty string
      return ['createdAt', 'updatedAt', 'priority', 'status'].includes(value);
    })
    .withMessage('Invalid sortBy field'),

  query('order')
    .optional()
    .custom((value) => {
      if (value === '') return true; // Allow empty string
      return ['asc', 'desc'].includes(value);
    })
    .withMessage('Order must be asc or desc'),

  query('search')
    .optional()
    .isLength({ min: 0, max: 100 }).withMessage('Search query too long'),

  query('assignedTo')
    .optional()
    .isMongoId().withMessage('Invalid assignedTo ID format')
];

// ─────────────────────────────────────────────
// Appointment Rules
// ─────────────────────────────────────────────

const confirmAppointmentRules = [
  body('meetingDetails')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Meeting details cannot exceed 500 characters'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
];

const rescheduleAppointmentRules = [
  body('scheduledAt')
    .notEmpty().withMessage('New scheduled date is required')
    .isISO8601().withMessage('scheduledAt must be a valid ISO 8601 date'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
];

const cancelAppointmentRules = [
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
];

const listAppointmentRules = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

  query('status')
    .optional()
    .isIn(['auto_booked', 'confirmed', 'completed', 'cancelled'])
    .withMessage('Invalid status filter'),

  query('category')
    .optional()
    .isIn(['wage_theft', 'wrongful_termination', 'harassment', 'discrimination'])
    .withMessage('Invalid category filter')
];

// ─────────────────────────────────────────────
// Registry Rules
// ─────────────────────────────────────────────

const registerOfficerRules = [
  body('officerId')
    .notEmpty().withMessage('Officer ID is required')
    .isMongoId().withMessage('Invalid officer ID format'),

  body('name')
    .trim()
    .notEmpty().withMessage('Officer name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),

  body('email')
    .notEmpty().withMessage('Officer email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),

  body('specializations')
    .notEmpty().withMessage('Specializations are required')
    .isArray({ min: 1 }).withMessage('At least one specialization is required')
    .custom((arr) => {
      const valid = ['labor_law', 'harassment_law', 'discrimination_law'];
      return arr.every((s) => valid.includes(s));
    }).withMessage('Invalid specialization. Must be: labor_law, harassment_law, or discrimination_law')
];

const updateOfficerRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),

  body('email')
    .optional()
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),

  body('specializations')
    .optional()
    .isArray({ min: 1 }).withMessage('At least one specialization is required')
    .custom((arr) => {
      const valid = ['labor_law', 'harassment_law', 'discrimination_law'];
      return arr.every((s) => valid.includes(s));
    }).withMessage('Invalid specialization. Must be: labor_law, harassment_law, or discrimination_law'),

  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be true or false')
];

const listRegistryRules = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

  query('specialization')
    .optional()
    .isIn(['labor_law', 'harassment_law', 'discrimination_law'])
    .withMessage('Invalid specialization filter'),

  query('isActive')
    .optional()
    .isIn(['true', 'false']).withMessage('isActive must be true or false'),

  query('sortBy')
    .optional()
    .isIn(['totalAssigned', 'activeAppointmentCount', 'lastAssignedAt', 'createdAt'])
    .withMessage('Invalid sortBy field'),

  query('order')
    .optional()
    .isIn(['asc', 'desc']).withMessage('Order must be asc or desc')
];

// ─────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────

module.exports = {
  // core
  validate,
  validateObjectId,
  validateOfficerObjectId,
  // complaint
  createComplaintRules,
  updateComplaintRules,
  updateStatusRules,
  assignComplaintRules,
  listComplaintsRules,
  // appointment
  confirmAppointmentRules,
  rescheduleAppointmentRules,
  cancelAppointmentRules,
  listAppointmentRules,
  // registry
  registerOfficerRules,
  updateOfficerRules,
  listRegistryRules
};

// const { body, param, query, validationResult } = require('express-validator');

// //Reusable middleware to check validation results.
// const validate = (req, res, next) => {
//   const errors = validationResult(req);

//   if (!errors.isEmpty()) {
//     return res.status(400).json({
//       success: false,
//       message: 'Validation failed',
//       errors: errors.array().map((err) => ({
//         field: err.path,
//         message: err.msg
//       }))
//     });
//   }

//   next();
// };

// // Validation rules for filing a new complaint
// const createComplaintRules = [
//   body('title')
//     .trim()
//     .notEmpty().withMessage('Title is required')
//     .isLength({ min: 10 }).withMessage('Title must be at least 10 characters')
//     .isLength({ max: 150 }).withMessage('Title cannot exceed 150 characters'),

//   body('description')
//     .trim()
//     .notEmpty().withMessage('Description is required')
//     .isLength({ min: 30 }).withMessage('Description must be at least 30 characters')
//     .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),

//   body('category')
//     .notEmpty().withMessage('Category is required')
//     .isIn([
//       'wage_theft',
//       'unsafe_conditions',
//       'wrongful_termination',
//       'harassment',
//       'discrimination',
//       'unpaid_overtime',
//       'other'
//     ]).withMessage('Invalid category'),

//   body('priority')
//     .optional()
//     .isIn(['low', 'medium', 'high', 'critical'])
//     .withMessage('Priority must be one of: low, medium, high, critical'),

//   body('organizationName')
//     .optional()
//     .trim()
//     .isLength({ max: 200 }).withMessage('Organization name cannot exceed 200 characters'),

//   body('location.city')
//     .optional()
//     .trim()
//     .isLength({ max: 100 }).withMessage('City name too long'),

//   body('location.district')
//     .optional()
//     .trim()
//     .isLength({ max: 100 }).withMessage('District name too long'),

//   body('isAnonymous')
//     .optional()
//     .isBoolean().withMessage('isAnonymous must be true or false')
// ];


// //Validation rules for updating an existing complaint (worker edits their own)

// const updateComplaintRules = [
//   body('title')
//     .optional()
//     .trim()
//     .isLength({ min: 10 }).withMessage('Title must be at least 10 characters')
//     .isLength({ max: 150 }).withMessage('Title cannot exceed 150 characters'),

//   body('description')
//     .optional()
//     .trim()
//     .isLength({ min: 30 }).withMessage('Description must be at least 30 characters')
//     .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),

//   body('category')
//     .optional()
//     .isIn([
//       'wage_theft',
//       'unsafe_conditions',
//       'wrongful_termination',
//       'harassment',
//       'discrimination',
//       'unpaid_overtime',
//       'other'
//     ]).withMessage('Invalid category'),

//   body('priority')
//     .optional()
//     .isIn(['low', 'medium', 'high', 'critical'])
//     .withMessage('Priority must be one of: low, medium, high, critical'),

//   body('organizationName')
//     .optional()
//     .trim()
//     .isLength({ max: 200 }).withMessage('Organization name cannot exceed 200 characters'),

//   body('location.city')
//     .optional()
//     .trim()
//     .isLength({ max: 100 }).withMessage('City name too long'),

//   body('location.district')
//     .optional()
//     .trim()
//     .isLength({ max: 100 }).withMessage('District name too long')
// ];


// //Validation rules for admin status update
// const updateStatusRules = [
//   body('status')
//     .notEmpty().withMessage('Status is required')
//     .isIn(['pending', 'under_review', 'resolved', 'rejected'])
//     .withMessage('Invalid status value'),

//   body('reason')
//     .optional()
//     .trim()
//     .isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
// ];


// //Validation rules for assigning a complaint to a legal officer
// const assignComplaintRules = [
//   body('officerId')
//     .notEmpty().withMessage('Officer ID is required')
//     .isMongoId().withMessage('Invalid officer ID format')
// ];


// //Validate MongoDB ObjectId in URL params
// const validateObjectId = [
//   param('id')
//     .isMongoId().withMessage('Invalid complaint ID format')
// ];


// //Validate query parameters for listing complaints
// const listComplaintsRules = [
//   query('page')
//     .optional()
//     .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

//   query('limit')
//     .optional()
//     .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

//   query('status')
//     .optional()
//     .isIn(['pending', 'under_review', 'resolved', 'rejected'])
//     .withMessage('Invalid status filter'),

//   query('category')
//     .optional()
//     .isIn([
//       'wage_theft',
//       'unsafe_conditions',
//       'wrongful_termination',
//       'harassment',
//       'discrimination',
//       'unpaid_overtime',
//       'other'
//     ]).withMessage('Invalid category filter'),

//   query('priority')
//     .optional()
//     .isIn(['low', 'medium', 'high', 'critical'])
//     .withMessage('Invalid priority filter'),

//   query('sortBy')
//     .optional()
//     .isIn(['createdAt', 'updatedAt', 'priority', 'status'])
//     .withMessage('Invalid sortBy field'),

//   query('order')
//     .optional()
//     .isIn(['asc', 'desc'])
//     .withMessage('Order must be asc or desc')
// ];

// module.exports = {
//   validate,
//   createComplaintRules,
//   updateComplaintRules,
//   updateStatusRules,
//   assignComplaintRules,
//   validateObjectId,
//   listComplaintsRules
// };