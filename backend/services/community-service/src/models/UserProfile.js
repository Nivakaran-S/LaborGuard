const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['worker', 'lawyer', 'ngo', 'ngo_representative', 'employer', 'admin'],
        default: 'worker',
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    avatarUrl: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: ''
    },
    followers: [{
        type: String
    }],
    following: [{
        type: String
    }],
    bookmarks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    // Privacy controls (Phase 3.1)
    isPrivate: {
        type: Boolean,
        default: false
    },
    hiddenFields: {
        type: [String],
        default: []  // Allowlist-validated in controller: 'bio' | 'followers' | 'following'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('UserProfile', userProfileSchema);
