const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['message', 'system', 'alert'],
        default: 'system'
    },
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    relatedId: {
        // ID of related entity, e.g., conversationId, postId
        type: String
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
