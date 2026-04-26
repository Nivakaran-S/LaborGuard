const axios = require('axios');
const crypto = require('crypto');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const TOXICITY_THRESHOLD = parseFloat(process.env.TOXICITY_THRESHOLD) || 0.7;

// ── API-call reducers ───────────────────────────────────────────────────────
//
// OpenAI's free-tier Moderation endpoint caps at ~50 req/min, and the user
// hits that during regular testing because every post + every comment makes
// one call. Three layers cut traffic without weakening moderation:
//
// 1. TTL cache, keyed on SHA-1 of normalised text → reuses verdicts when
//    the same text comes back (duplicate comments, edits to the same body,
//    quickly re-saving a post). 10-minute TTL.
// 2. Min-length skip — single-word "hi" / "ok" / a lone emoji can't be
//    meaningfully classified, and they dominate test traffic.
// 3. Post-429 cooldown — when we get rate-limited, set a 60s window during
//    which we DON'T even call the API. Two benefits: (a) we stop hammering
//    OpenAI right after they told us to back off, (b) burst traffic in that
//    window doesn't all stack into 429s either.

const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 1000;
const MIN_TEXT_LEN = 4;
const COOLDOWN_AFTER_429_MS = 60 * 1000;

const cache = new Map(); // key → { result, expiresAt }
let cooldownUntil = 0;

const cacheKey = (text) =>
    crypto.createHash('sha1').update(text.trim().toLowerCase()).digest('hex');

const cacheGet = (key) => {
    const hit = cache.get(key);
    if (!hit) return null;
    if (hit.expiresAt < Date.now()) {
        cache.delete(key);
        return null;
    }
    return hit.result;
};

const cacheSet = (key, result) => {
    if (cache.size >= CACHE_MAX_ENTRIES) {
        // Cheap LRU-ish eviction — drop the oldest entry.
        const oldestKey = cache.keys().next().value;
        if (oldestKey) cache.delete(oldestKey);
    }
    cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
};

const PASS = { isToxic: false, score: 0 };

const analyzeText = async (text) => {
    if (!OPENAI_API_KEY) {
        console.warn('[community-service] OPENAI_API_KEY not set, skipping toxicity check');
        return PASS;
    }

    const trimmed = (text || '').trim();
    if (trimmed.length === 0) return PASS;

    // Layer 2 — too-short to classify reliably; skip the API.
    if (trimmed.length < MIN_TEXT_LEN) return PASS;

    // Layer 1 — cache hit.
    const key = cacheKey(trimmed);
    const cached = cacheGet(key);
    if (cached) return cached;

    // Layer 3 — we're in cooldown after a recent 429. Fail-open without
    // calling the API. Caller never notices.
    if (Date.now() < cooldownUntil) return PASS;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/moderations',
            { input: trimmed },
            {
                headers: {
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                timeout: 5000,
            }
        );

        const result = response.data.results[0];
        const maxScore = Math.max(...Object.values(result.category_scores));

        const verdict = {
            isToxic: result.flagged || maxScore >= TOXICITY_THRESHOLD,
            score: maxScore,
            categories: result.categories,
        };
        cacheSet(key, verdict);
        return verdict;
    } catch (error) {
        const status = error.response?.status;
        if (status === 429) {
            cooldownUntil = Date.now() + COOLDOWN_AFTER_429_MS;
            console.warn(
                `[community-service] OpenAI Moderation rate-limited (429); skipping checks for ${COOLDOWN_AFTER_429_MS / 1000}s`
            );
        } else {
            console.error('[community-service] OpenAI Moderation API error:', error.message);
        }
        return PASS;
    }
};

module.exports = { analyzeText };
