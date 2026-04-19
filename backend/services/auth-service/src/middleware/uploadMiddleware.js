const multer = require('multer');
const path = require('path');

// Use memory storage to avoid library connection conflicts and race conditions.
// We will manually stream the files to GridFS in the controller.
const storage = multer.memoryStorage();

// Build the upload middleware
const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|pdf/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images (JPG, PNG) and PDF files are allowed!'));
        }
    }
});

module.exports = upload;
