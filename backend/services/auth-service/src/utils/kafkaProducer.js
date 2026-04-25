/**
 * Cross-service event emitter — HTTP edition (no Kafka).
 *
 * Same `emitEvent(topic, type, payload)` signature so callers don't change.
 * POSTs to sibling services' `/api/internal/events/:topic` guarded by
 * `INTERNAL_SERVICE_SECRET`.
 *
 * Routing rules (auth-service):
 *   auth-events → community-service (user_registered → create UserProfile)
 *               → notification-service (user_warned/suspended/banned)
 */

const SERVICE_NAME = process.env.SERVICE_NAME || 'auth-service';
const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:5004';
const COMMUNITY_URL = process.env.COMMUNITY_SERVICE_URL || 'http://community-service:5002';
const SECRET = process.env.INTERNAL_SERVICE_SECRET || '';

const ROUTES = {
    'auth-events': [NOTIFICATION_URL, COMMUNITY_URL],
};

const postEvent = async (baseUrl, topic, eventType, payload) => {
    if (!SECRET) {
        console.warn(`[${SERVICE_NAME}] INTERNAL_SERVICE_SECRET not set — skipping ${eventType}`);
        return;
    }
    try {
        const res = await fetch(`${baseUrl}/api/internal/events/${topic}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-internal-secret': SECRET,
            },
            body: JSON.stringify({
                type: eventType,
                timestamp: new Date().toISOString(),
                payload,
            }),
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) {
            console.warn(`[${SERVICE_NAME}] ${baseUrl} returned ${res.status} for ${eventType}`);
        } else {
            console.log(`[${SERVICE_NAME}] Posted ${eventType} to ${baseUrl}`);
        }
    } catch (err) {
        console.error(`[${SERVICE_NAME}] Failed to emit ${eventType}: ${err.message}`);
    }
};

// Returns a Promise that resolves once all consumer POSTs have settled.
// Never rejects — failures are logged in postEvent. Callers can either
// `await` it, chain `.then/.catch`, or fire-and-forget without an await.
const emitEvent = (topic, eventType, payload) => {
    const targets = ROUTES[topic];
    if (!targets) {
        console.warn(`[${SERVICE_NAME}] No HTTP route configured for topic ${topic}`);
        return Promise.resolve();
    }
    return Promise.allSettled(
        targets.map((url) => postEvent(url, topic, eventType, payload))
    );
};

// Legacy: server.js calls connectProducer() once at boot. No-op now.
const connectProducer = async () => {};

module.exports = { emitEvent, connectProducer };
