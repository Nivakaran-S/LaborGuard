const express = require('express');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const authController = require('../controllers/authController');
const oauthController = require('../controllers/oauthController');
const {
  registerValidator,
  loginValidator,
  verifyCodeValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
} = require('../utils/validators');
const validate = require('../middleware/validationMiddleware');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// ── Rate limiting ────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 10, // Higher limit for dev
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes',
  },
});

// ── Public routes ────────────────────────────────────────────

// Registration with optional document uploads (up to 5 files)
router.post('/register', upload.array('documents', 5), registerValidator, validate, authController.register);

// Retrieve a document from GridFS by filename
router.get('/documents/:filename', authController.getDocument);

router.post('/login', loginLimiter, loginValidator, validate, authController.login);

// Verify email or SMS code — body: { userId, code, type }
router.post('/verify', verifyCodeValidator, validate, authController.verify);

// FIX: Added missing resend-verification route
router.post('/resend-verification', authController.resendVerification);

router.post('/forgot-password', forgotPasswordValidator, validate, authController.forgotPassword);

// FIX: reset-password accepts { email, code, newPassword } in body — no URL token
router.post('/reset-password', resetPasswordValidator, validate, authController.resetPassword);

router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// ── Protected routes ─────────────────────────────────────────
router.get('/me', protect, authController.getProfile);
router.patch('/me', protect, upload.single('profileImage'), authController.updateProfile);
router.post('/change-password', protect, changePasswordValidator, validate, authController.changePassword);

// ── Google OAuth ──────────────────────────────────────────────
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  oauthController.googleCallback
);

module.exports = router;
