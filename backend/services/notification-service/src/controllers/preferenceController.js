const NotificationPreference = require('../models/NotificationPreference');
const { invalidate } = require('../utils/preferenceGate');

exports.getPreferences = async (req, res) => {
    try {
        const userId = req.user.userId;

        const prefs = await NotificationPreference.findOneAndUpdate(
            { userId },
            { $setOnInsert: { userId } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();

        res.json(prefs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching preferences', error: error.message });
    }
};

exports.updatePreferences = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { emailEnabled, inAppEnabled, perType } = req.body;

        const update = {};
        if (typeof emailEnabled === 'boolean') update.emailEnabled = emailEnabled;
        if (typeof inAppEnabled === 'boolean') update.inAppEnabled = inAppEnabled;
        if (perType && typeof perType === 'object') {
            for (const [key, value] of Object.entries(perType)) {
                if (value && typeof value === 'object') {
                    if (typeof value.inApp === 'boolean') update[`perType.${key}.inApp`] = value.inApp;
                    if (typeof value.email === 'boolean') update[`perType.${key}.email`] = value.email;
                }
            }
        }

        const prefs = await NotificationPreference.findOneAndUpdate(
            { userId },
            { $set: update, $setOnInsert: { userId } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        invalidate(userId);
        res.json(prefs);
    } catch (error) {
        res.status(500).json({ message: 'Error updating preferences', error: error.message });
    }
};
