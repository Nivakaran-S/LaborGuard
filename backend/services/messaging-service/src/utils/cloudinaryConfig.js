const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();

// Reject obviously dangerous types (executables, scripts) but allow the long
// tail of "things people actually attach in a chat" — images, video, audio,
// documents, archives. Cloudinary handles each via resource_type:'auto'.
const BLOCKED_MIME_PREFIXES = ['application/x-msdownload', 'application/x-sh'];
const BLOCKED_EXTENSIONS = /\.(exe|msi|bat|cmd|sh|ps1|jar|vbs|scr|dll)$/i;

const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024,        // 50 MB per file
        files: 10,                         // up to 10 attachments per message
    },
    fileFilter: (req, file, cb) => {
        if (BLOCKED_MIME_PREFIXES.some((p) => file.mimetype.startsWith(p))) {
            return cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
        }
        if (BLOCKED_EXTENSIONS.test(file.originalname || '')) {
            return cb(new Error(`Unsupported file extension`), false);
        }
        cb(null, true);
    },
});

const uploadToCloudinary = (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const uploadOptions = {
            folder: 'laborguard-messaging',
            resource_type: 'auto',
            ...options
        };

        const stream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );

        stream.end(buffer);
    });
};

module.exports = { cloudinary, upload, uploadToCloudinary };
