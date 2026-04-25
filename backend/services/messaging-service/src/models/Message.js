const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
    url: { type: String, required: true },
    // Coarse bucket for rendering: 'image' | 'video' | 'audio' | 'file'
    type: { type: String, enum: ['image', 'video', 'audio', 'file'], default: 'file' },
    name: { type: String, default: '' },             // original filename
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },              // bytes
}, { _id: false });

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    senderId: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: false
    },
    // Rich attachment metadata (added when files are sent). The legacy
    // mediaUrls field below stays for older clients that don't yet know
    // about `attachments` — both arrays are written in lock-step.
    attachments: {
        type: [attachmentSchema],
        default: [],
    },
    mediaUrls: [{
        type: String
    }],
    readBy: [{
        type: String
    }]
}, {
    timestamps: true
});

messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
