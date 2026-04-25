const mongoose = require('mongoose');

const channelToggle = {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false }, // email disabled by default — opt-in
};

const notificationPreferenceSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true, index: true },
    emailEnabled: { type: Boolean, default: false },
    inAppEnabled: { type: Boolean, default: true },
    perType: {
        post_liked:              channelToggle,
        post_commented:          channelToggle,
        user_followed:           channelToggle,
        follow_requested:        channelToggle,
        follow_request_approved: channelToggle,
        complaint_status:        channelToggle,
        campaign_update:         channelToggle,
        campaign_supported:      channelToggle,
        report_resolved:         channelToggle,
        user_warned:             channelToggle,
    },
}, { timestamps: true });

module.exports = mongoose.model('NotificationPreference', notificationPreferenceSchema);
