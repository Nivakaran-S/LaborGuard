const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: String,
        required: true
    }],
    participantRoles: [{
        userId: { type: String, required: true },
        role: {
            type: String,
            enum: ['worker', 'lawyer', 'ngo_representative', 'employer', 'admin'],
            required: true
        }
    }],
    isGroup: {
        type: Boolean,
        default: false
    },
    groupName: {
        type: String,
        default: ''
    },
    lastMessage: {
        senderId: String,
        content: String,
        timestamp: Date
    },
    relatedCaseId: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

conversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
