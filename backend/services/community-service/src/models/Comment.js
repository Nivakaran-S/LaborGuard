const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    authorId: {
        type: String,
        required: true
    },
    // Denormalized author fields (match Post pattern — cheap client rendering)
    authorName:   { type: String, default: '' },
    authorAvatar: { type: String, default: '' },
    content: {
        type: String,
        required: true
    },
    // Threading (depth capped at 1 — top-level + direct replies, no infinite nesting)
    parentCommentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null,
        index: true
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date,
        default: null
    },
    isReported: {
        type: Boolean,
        default: false
    },
    reportCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

commentSchema.index({ postId: 1, createdAt: 1 });
commentSchema.index({ postId: 1, parentCommentId: 1, createdAt: 1 });

module.exports = mongoose.model('Comment', commentSchema);
