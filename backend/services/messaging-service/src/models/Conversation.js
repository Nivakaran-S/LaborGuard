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
    // Denormalized display info per participant — written at conversation
    // creation time so the conversation list can show "Jane Doe (lawyer)"
    // without a per-render cross-service call to auth-service. Keyed by userId.
    // Mongoose Mixed type so we can store an arbitrary userId → {name,email,role} map.
    participantInfo: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
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
