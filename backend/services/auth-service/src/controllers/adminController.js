const adminService = require('../services/adminService');
const aiService = require('../services/aiService');
const { getGridFSBucket } = require('../config/gridfs');
const User = require('../models/User');

const getAllUsers = async (req, res, next) => {
    try {
        const result = await adminService.getAllUsers(req.query);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const updateUserRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!role) {
            return res.status(400).json({ success: false, message: 'Role is required' });
        }

        const result = await adminService.updateUserRole(id, role);
        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        next(error);
    }
};

const deactivateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body; // Expecting boolean

        if (isActive === undefined) {
            return res.status(400).json({ success: false, message: 'isActive status is required' });
        }

        const result = await adminService.updateAccountStatus(id, isActive);
        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        next(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await adminService.deleteUser(id);
        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        next(error);
    }
};

const approveUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await adminService.approveUser(id);
        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        next(error);
    }
};

const analyzeUserDocuments = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!user.documents || user.documents.length === 0) {
            return res.status(400).json({ success: false, message: 'User has no uploaded documents to analyze' });
        }

        const bucket = getGridFSBucket();
        if (!bucket) {
            throw new Error('File storage unavailable');
        }

        console.log(`Starting AI analysis for user ${user.email} (${user.role})...`);

        // Fetch all documents from GridFS as buffers
        const documentBuffers = await Promise.all(
            user.documents.map(async (filename) => {
                const files = await bucket.find({ filename }).toArray();
                if (!files || files.length === 0) return null;

                const file = files[0];
                const chunks = [];
                const downloadStream = bucket.openDownloadStreamByName(filename);

                return new Promise((resolve, reject) => {
                    downloadStream.on('data', (chunk) => chunks.push(chunk));
                    downloadStream.on('error', (err) => reject(err));
                    downloadStream.on('end', () => {
                        resolve({
                            buffer: Buffer.concat(chunks),
                            mimeType: file.contentType || 'application/octet-stream'
                        });
                    });
                });
            })
        );

        const validDocuments = documentBuffers.filter(doc => doc !== null);

        if (validDocuments.length === 0) {
            return res.status(404).json({ success: false, message: 'No valid documents found in storage' });
        }

        // Send to Gemini AI
        const aiResult = await aiService.analyzeDocuments(validDocuments, user.role);

        res.status(200).json({
            success: true,
            data: aiResult
        });
    } catch (error) {
        console.error('AI Analysis Controller Error:', error);
        next(error);
    }
};

const rejectUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        
        // Reason is highly recommended but we could allow a fallback in the service
        const result = await adminService.rejectUser(id, reason);
        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllUsers,
    updateUserRole,
    deactivateUser,
    deleteUser,
    approveUser,
    analyzeUserDocuments,
    rejectUser
};
