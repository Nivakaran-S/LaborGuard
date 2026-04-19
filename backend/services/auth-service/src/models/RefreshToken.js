const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// TTL index to automatically delete expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index on userId and expiresAt
refreshTokenSchema.index({ userId: 1, expiresAt: 1 });

refreshTokenSchema.methods.isExpired = function () {
    return Date.now() >= this.expiresAt;
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
