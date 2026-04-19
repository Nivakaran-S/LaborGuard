const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reporterId: {
        type: String,
        required: true
    },
    targetType: {
        type: String,
        required: true,
        enum: ['Post', 'Comment', 'UserProfile']
    },
    targetId: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Reviewed', 'Resolved'],
        default: 'Pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
