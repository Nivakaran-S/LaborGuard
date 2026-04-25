const NotificationPreference = require('../models/NotificationPreference');

// Simple in-memory cache: userId → { prefs, expiresAt }
const cache = new Map();
const TTL_MS = 60 * 1000;

const getDefault = () => ({
    emailEnabled: false,
    inAppEnabled: true,
    perType: {}, // absent per-type key = allowed by default
});

const loadPrefs = async (userId) => {
    const now = Date.now();
    const cached = cache.get(userId);
    if (cached && cached.expiresAt > now) return cached.prefs;

    const prefs = (await NotificationPreference.findOne({ userId }).lean()) || getDefault();
    cache.set(userId, { prefs, expiresAt: now + TTL_MS });
    return prefs;
};

/**
 * Decide whether a notification should be created / sent.
 * Defaults open: missing prefs => allow inApp, skip email (unless globally enabled).
 */
const shouldNotify = async (userId, typeKey, channel = 'inApp') => {
    if (!userId) return false;
    try {
        const prefs = await loadPrefs(userId);
        if (channel === 'email' && !prefs.emailEnabled) return false;
        if (channel === 'inApp' && prefs.inAppEnabled === false) return false;

        const typeCfg = prefs.perType?.[typeKey];
        if (!typeCfg) return true;
        return typeCfg[channel] !== false;
    } catch {
        return true; // fail-open: never drop notifications on prefs error
    }
};

const invalidate = (userId) => cache.delete(userId);

module.exports = { shouldNotify, invalidate };
