/**
 * userLookup.js — cross-service user email resolver.
 *
 * notification-service doesn't own user emails; auth-service does. When we want
 * to email a user based on a Kafka event we look them up here. A short in-memory
 * LRU-ish cache (5 min) keeps traffic on auth-service manageable.
 *
 * Uses Node's built-in fetch (Node 18+).
 */

const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:5001';
const SECRET = process.env.INTERNAL_SERVICE_SECRET || '';
const TTL_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 500;

// userId → { user, expiresAt }
const cache = new Map();

const pruneCache = () => {
    if (cache.size <= MAX_ENTRIES) return;
    // Drop the oldest ~50 entries (Map preserves insertion order).
    const toDrop = cache.size - MAX_ENTRIES + 50;
    let i = 0;
    for (const key of cache.keys()) {
        if (i >= toDrop) break;
        cache.delete(key);
        i++;
    }
};

const lookupUser = async (userId) => {
    if (!userId) return null;
    const now = Date.now();
    const cached = cache.get(userId);
    if (cached && cached.expiresAt > now) return cached.user;

    if (!SECRET) {
        console.warn('[userLookup] INTERNAL_SERVICE_SECRET not set — skipping lookup for', userId);
        return null;
    }

    try {
        const url = `${AUTH_URL}/api/auth/internal/users/${encodeURIComponent(userId)}/email`;
        const res = await fetch(url, {
            method: 'GET',
            headers: { 'x-internal-secret': SECRET },
            // Short timeout — email isn't on the request hot path
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) {
            console.warn(`[userLookup] auth-service returned ${res.status} for ${userId}`);
            return null;
        }
        const body = await res.json();
        const user = body?.data || null;
        if (user) {
            cache.set(userId, { user, expiresAt: now + TTL_MS });
            pruneCache();
        }
        return user;
    } catch (err) {
        console.error('[userLookup] lookup failed:', err.message);
        return null;
    }
};

module.exports = { lookupUser };
