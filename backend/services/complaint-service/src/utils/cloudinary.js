const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Setup storage for complaints evidence
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'laborguard/evidence',
        allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
        public_id: (req, file) => {
            const complaintId = req.params.id || 'unknown';
            return `complaint_${complaintId}_${Date.now()}`;
        },
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = {
    cloudinary,
    upload,
};
