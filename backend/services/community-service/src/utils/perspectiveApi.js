const axios = require('axios');
const crypto = require('crypto');

// ── Provider selection ─────────────────────────────────────────────────────
//
// Two backends are supported. The first one with a key configured wins:
//
//   1. Groq (preferred — faster, more generous free tier). Uses Llama 3.3
//      70B with JSON-mode for a structured verdict. ~30 RPM / 6000 req-day
//      on the free tier.
//
//   2. OpenAI Moderation API (fallback). Purpose-built classifier, no LLM
//      tokens, but the free tier rate-limits aggressively (~50 RPM).
//
// Setting MODERATION_PROVIDER=openai|groq forces a specific provider. With
// neither key set, every check passes through (fail-open, logged once).

const TOXICITY_THRESHOLD = parseFloat(process.env.TOXICITY_THRESHOLD) || 0.7;
const GROQ_API_KEY    = process.env.GROQ_API_KEY || '';
const OPENAI_API_KEY  = process.env.OPENAI_API_KEY || '';
const FORCED_PROVIDER = (process.env.MODERATION_PROVIDER || '').toLowerCase();

const pickProvider = () => {
    if (FORCED_PROVIDER === 'groq')   return GROQ_API_KEY   ? 'groq'   : null;
    if (FORCED_PROVIDER === 'openai') return OPENAI_API_KEY ? 'openai' : null;
    if (GROQ_API_KEY)   return 'groq';
    if (OPENAI_API_KEY) return 'openai';
    return null;
};

// ── API-call reducers (apply to BOTH providers) ───────────────────────────
//   1. SHA-1 cache (10 min, 1000 entries)
//   2. Skip-tiny-text (< 4 chars)
//   3. Post-429 cooldown (60 s)
const CACHE_TTL_MS          = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES     = 1000;
const MIN_TEXT_LEN          = 4;
const COOLDOWN_AFTER_429_MS = 60 * 1000;

const cache = new Map();
let cooldownUntil = 0;

const cacheKey = (text) =>
    crypto.createHash('sha1').update(text.trim().toLowerCase()).digest('hex');

const cacheGet = (key) => {
    const hit = cache.get(key);
    if (!hit) return null;
    if (hit.expiresAt < Date.now()) { cache.delete(key); return null; }
    return hit.result;
};

const cacheSet = (key, result) => {
    if (cache.size >= CACHE_MAX_ENTRIES) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey) cache.delete(oldestKey);
    }
    cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
};

const PASS = { isToxic: false, score: 0 };

// ── Provider implementations ──────────────────────────────────────────────

const callGroq = async (text) => {
    // Llama 3.3 70B in JSON mode. System prompt forces JSON-only output so
    // we don't have to parse free-form text. Categories mirror OpenAI's
    // moderation taxonomy so downstream code stays compatible.
    const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' },
            temperature: 0,
            max_tokens: 200,
            messages: [
                {
                    role: 'system',
                    content:
                        `You are a content moderation classifier. Read the user message and respond with JSON ONLY in this exact shape:
{
  "flagged": boolean,
  "severity": number between 0 and 1,
  "categories": {
    "hate": boolean,
    "harassment": boolean,
    "sexual": boolean,
    "violence": boolean,
    "self_harm": boolean
  }
}
Classify the message itself, not what it describes. Discussions of labor abuse, wage theft, or worker rights are NOT flagged. Slurs, threats, sexual content involving minors, and harassment ARE flagged.`,
                },
                { role: 'user', content: text },
            ],
        },
        {
            headers: {
                Authorization: `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            timeout: 8000,
        }
    );

    const raw = response.data.choices?.[0]?.message?.content || '{}';
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch { return PASS; } // model returned non-JSON — fail-open

    const severity = typeof parsed.severity === 'number'
        ? Math.max(0, Math.min(1, parsed.severity))
        : 0;
    return {
        isToxic: !!parsed.flagged || severity >= TOXICITY_THRESHOLD,
        score: severity,
        categories: parsed.categories || {},
    };
};

const callOpenAI = async (text) => {
    const response = await axios.post(
        'https://api.openai.com/v1/moderations',
        { input: text },
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
    return {
        isToxic: result.flagged || maxScore >= TOXICITY_THRESHOLD,
        score: maxScore,
        categories: result.categories,
    };
};

// ── Public API ────────────────────────────────────────────────────────────

const analyzeText = async (text) => {
    const provider = pickProvider();
    if (!provider) {
        console.warn('[community-service] No moderation key set (GROQ_API_KEY / OPENAI_API_KEY) — skipping toxicity check');
        return PASS;
    }

    const trimmed = (text || '').trim();
    if (trimmed.length === 0) return PASS;
    if (trimmed.length < MIN_TEXT_LEN) return PASS;

    const key = cacheKey(trimmed);
    const cached = cacheGet(key);
    if (cached) return cached;

    if (Date.now() < cooldownUntil) return PASS;

    try {
        const verdict = provider === 'groq'
            ? await callGroq(trimmed)
            : await callOpenAI(trimmed);
        cacheSet(key, verdict);
        return verdict;
    } catch (error) {
        const status = error.response?.status;
        if (status === 429) {
            cooldownUntil = Date.now() + COOLDOWN_AFTER_429_MS;
            console.warn(
                `[community-service] ${provider} moderation rate-limited (429); skipping checks for ${COOLDOWN_AFTER_429_MS / 1000}s`
            );
        } else {
            console.error(`[community-service] ${provider} moderation error:`, error.message);
        }
        return PASS;
    }
};

module.exports = { analyzeText };
