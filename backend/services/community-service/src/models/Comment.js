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
    content: {
        type: String,
        required: true
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

module.exports = mongoose.model('Comment', commentSchema);
