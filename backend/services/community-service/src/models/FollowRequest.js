const mongoose = require('mongoose');

const followRequestSchema = new mongoose.Schema({
    requesterId: { type: String, required: true, index: true },
    targetUserId: { type: String, required: true, index: true },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true,
    },
    // Denormalized for cheap UI rendering
    requesterName: { type: String, default: '' },
    requesterAvatar: { type: String, default: '' },
    requesterRole: { type: String, default: 'worker' },
}, { timestamps: true });

// One pending request per (requester, target) pair at a time.
followRequestSchema.index(
    { requesterId: 1, targetUserId: 1, status: 1 },
    { unique: true, partialFilterExpression: { status: 'pending' } }
);

module.exports = mongoose.model('FollowRequest', followRequestSchema);
