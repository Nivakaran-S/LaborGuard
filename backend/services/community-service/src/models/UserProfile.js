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
    // Denormalized from auth-service via user_registered event so the Explore
    // search can disambiguate users who happen to share a name. Older profiles
    // pre-date this field and will read as undefined — UI falls back to a
    // userId suffix in that case.
    email: {
        type: String,
        default: '',
        lowercase: true,
        trim: true,
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
