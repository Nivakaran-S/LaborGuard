const mongoose = require('mongoose');

const verificationCodeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    code: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['email', 'sms'],
        required: true
    },
    purpose: {
        type: String,
        enum: ['registration', 'password_reset', 'login_2fa'],
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// TTL index to automatically delete expired codes (cleanup buffer)
verificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 900 }); // 15 mins buffer

// Compound index
verificationCodeSchema.index({ userId: 1, code: 1, type: 1 });

verificationCodeSchema.methods.isExpired = function () {
    return Date.now() >= this.expiresAt;
};

module.exports = mongoose.model('VerificationCode', verificationCodeSchema);
