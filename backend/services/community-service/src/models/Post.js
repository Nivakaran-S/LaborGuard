const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    authorId: {
        type: String,
        required: true
    },
    // Denormalized author fields — written at create time so feed queries need no join
    authorName: { type: String, default: '' },
    authorAvatar: { type: String, default: '' },
    authorRole: { type: String, default: 'worker' },
    content: {
        type: String,
        required: true
    },
    mediaUrls: [{
        type: String
    }],
    likes: [{
        type: String
    }],
    shareCount: {
        type: Number,
        default: 0
    },
    commentCount: {
        type: Number,
        default: 0
    },
    hashtags: [{
        type: String
    }],
    poll: {
        question: String,
        options: [{
            text: String,
            votes: [{ type: String }]
        }]
    },
    isReported: {
        type: Boolean,
        default: false
    },
    reportCount: {
        type: Number,
        default: 0
    },
    // Campaign linkage (Phase 4.1). null for normal posts.
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign',
        default: null,
        index: true
    }
}, {
    timestamps: true
});

postSchema.index({ createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ authorId: 1 });
// Full-text search on content + hashtags (Feature #6). First boot may take
// ~30s on existing collections while the index is built.
postSchema.index({ content: 'text', hashtags: 'text' });

module.exports = mongoose.model('Post', postSchema);
