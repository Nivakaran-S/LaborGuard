const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema({
    authorId: {
        type: String,
        required: true
    },
    content: {
        type: String
    },
    mediaUrl: {
        type: String
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(+new Date() + 24 * 60 * 60 * 1000) // 24 hours from now
    }
}, {
    timestamps: true
});

statusSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Status', statusSchema);
