const { body } = require('express-validator');
const { validatePasswordStrength } = require('./passwordHelper');

const registerValidator = [
    body('firstName')
        .trim()
        .notEmpty().withMessage('First name is required'),

    body('lastName')
        .trim()
        .notEmpty().withMessage('Last name is required'),

    body('birthDate')
        .isISO8601().withMessage('Please provide a valid birth date'),

    body('email')
        .trim()
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),

    body('phone')
        .trim()
        .matches(/^07[0-9]{8}$/).withMessage('Please provide a valid 10-digit Sri Lankan phone number (07XXXXXXXX)'),

    body('password')
        .custom((value) => {
            const result = validatePasswordStrength(value);
            if (!result.valid) {
                throw new Error(result.message);
            }
            return true;
        }),

    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Password confirmation does not match password');
            }
            return true;
        }),

    body('role')
        .optional()
        .isIn(['worker', 'lawyer', 'ngo', 'employer', 'admin']).withMessage('Invalid role'),

    body('documents')
        .custom((value, { req }) => {
            if (req.body.role && req.body.role !== 'worker' && req.body.role !== 'admin') {
                // If it's a multipart form, documents will be in req.files
                if ((!value || value.length === 0) && (!req.files || req.files.length === 0)) {
                    throw new Error('Verification documents are required for this role');
                }
            }
            return true;
        })
];

const loginValidator = [
    body('email')
        .trim()
        .isEmail().withMessage('Please provide a valid email'),

    body('password')
        .notEmpty().withMessage('Password is required')
];

const verifyCodeValidator = [
    body('userId')
        .notEmpty().withMessage('User ID is required'),

    body('code')
        .trim()
        .isLength({ min: 6, max: 6 }).withMessage('Invalid code length'),

    body('type')
        .isIn(['email', 'sms']).withMessage('Invalid verification type')
];

const updateProfileValidator = [
    body('name')
        .optional()
        .trim()
        .notEmpty().withMessage('Name cannot be empty'),

    body('profile.occupation')
        .optional()
        .trim(),

    body('profile.location')
        .optional()
        .trim(),

    body('profile.preferredLanguage')
        .optional()
        .isIn(['en', 'si', 'ta']).withMessage('Invalid language selection')
];

const changePasswordValidator = [
    body('currentPassword')
        .notEmpty().withMessage('Current password is required'),

    body('newPassword')
        .custom((value) => {
            const result = validatePasswordStrength(value);
            if (!result.valid) {
                throw new Error(result.message);
            }
            return true;
        })
];

const forgotPasswordValidator = [
    body('email')
        .isEmail().withMessage('Valid email is required')
];

const resetPasswordValidator = [
    body('email')
        .isEmail().withMessage('Valid email is required'),

    body('code')
        .isLength({ min: 6, max: 6 }).withMessage('Valid code is required'),

    body('newPassword')
        .custom((value) => {
            const result = validatePasswordStrength(value);
            if (!result.valid) {
                throw new Error(result.message);
            }
            return true;
        })
];

module.exports = {
    registerValidator,
    loginValidator,
    verifyCodeValidator,
    updateProfileValidator,
    changePasswordValidator,
    forgotPasswordValidator,
    resetPasswordValidator
};
