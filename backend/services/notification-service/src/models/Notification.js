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
    // UX-level grouping for the notifications page filters. type is the
    // storage bucket; category is what the user filters by. Backfills to
    // 'system' for older docs that pre-date the field.
    category: {
        type: String,
        enum: ['message', 'community', 'complaint', 'moderation', 'system'],
        default: 'system',
        index: true,
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
