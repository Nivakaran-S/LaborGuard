const authService = require('../services/authService');
const { getGridFSBucket } = require('../config/gridfs');
const { Readable } = require('stream');

/**
 * Helper: stream a multer in-memory file buffer up to GridFS
 */
const uploadToGridFS = (file, bucket) => {
  return new Promise((resolve, reject) => {
    const filename = `${Date.now()}-laborguard-${file.originalname}`;
    const uploadStream = bucket.openUploadStream(filename, { contentType: file.mimetype });

    const readableStream = new Readable();
    readableStream.push(file.buffer);
    readableStream.push(null);

    readableStream
      .pipe(uploadStream)
      .on('error', (err) => reject(err))
      .on('finish', () => resolve(filename));
  });
};

// ── POST /auth/register ──────────────────────────────────────
const register = async (req, res, next) => {
  try {
    console.log('--- Registration Request (Secure Stream) ---');
    const userData = { ...req.body };
    const bucket = getGridFSBucket();

    if (!bucket) {
      console.error('GridFS Error: Bucket not initialized');
      throw new Error('Database file storage is currently unavailable. Please try again in a moment.');
    }

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      console.log(`Step 1: Streaming ${req.files.length} files to GridFS...`);
      const uploadPromises = req.files.map((file) => uploadToGridFS(file, bucket));
      userData.documents = await Promise.all(uploadPromises);
      console.log('Files successfully streamed:', userData.documents);
    } else {
      console.log('Step 1: No files provided');
    }

    console.log('Step 2: Creating User Record...');
    const result = await authService.registerUser(userData);

    console.log('Step 3: Registration SUCCESS');
    res.status(201).json({ success: true, message: result.message, data: result });
  } catch (error) {
    console.error('Registration Error:', error.message);
    next(error);
  }
};

// ── POST /auth/login ─────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    res.status(200).json({ success: true, message: 'Login successful', data: result });
  } catch (error) {
    next(error);
  }
};

// ── POST /auth/verify ────────────────────────────────────────
// Body: { userId, code, type }   type = 'email' | 'sms'
const verify = async (req, res, next) => {
  try {
    const { userId, code, type } = req.body;
    const result = await authService.verifyCode(userId, code, type);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

// ── POST /auth/resend-verification  (FIX: was missing entirely) ──
// Body: { email }
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const result = await authService.resendVerificationCode(email);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

// ── POST /auth/forgot-password ───────────────────────────────
// Body: { email }
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

// ── POST /auth/reset-password ────────────────────────────────
// Body: { email, code, newPassword }  — FIX: no URL token anymore
const resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;
    const result = await authService.resetPassword(email, code, newPassword);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

// ── POST /auth/refresh ───────────────────────────────────────
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken(refreshToken);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ── POST /auth/logout ────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.logoutUser(refreshToken);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

// ── POST /auth/change-password  (protected) ──────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

// ── GET /auth/me  (protected) ────────────────────────────────
// FIX: handler was missing from original controller
const getProfile = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /auth/me  (protected) ──────────────────────────────
// FIX: handler was missing from original controller
const updateProfile = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const allowedFields = ['firstName', 'lastName', 'phone', 'address', 'profileImage'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// ── GET /auth/documents/:filename ───────────────────────────
const getDocument = async (req, res, next) => {
  try {
    const bucket = getGridFSBucket();
    const filename = req.params.filename;

    if (!bucket) return res.status(500).json({ success: false, message: 'File storage unavailable' });

    const files = await bucket.find({ filename }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const file = files[0];
    if (file.contentType) res.set('Content-Type', file.contentType);

    const downloadStream = bucket.openDownloadStreamByName(filename);
    downloadStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  verify,
  resendVerification,   // FIX: added
  forgotPassword,
  resetPassword,
  refresh,
  logout,
  changePassword,
  getProfile,           // FIX: added
  updateProfile,        // FIX: added
  getDocument,
};
