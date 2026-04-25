/**
 * Cross-service event emitter — HTTP edition (no Kafka).
 *
 * Same `emitEvent(topic, type, payload)` signature as before, so existing
 * controllers don't change. Under the hood we POST to sibling services'
 * `/api/internal/events` endpoint, guarded by a shared `INTERNAL_SERVICE_SECRET`.
 *
 * Routing rules (community-service is a producer of community-events only):
 *   community-events   → notification-service (always)
 *
 * Fire-and-forget: callers don't `await` this, errors are swallowed and logged.
 * 5-second AbortSignal.timeout keeps a slow consumer from stalling the producer.
 */

const SERVICE_NAME = process.env.SERVICE_NAME || 'community-service';
const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:5004';
const SECRET = process.env.INTERNAL_SERVICE_SECRET || '';

// Topics → list of base URLs that should receive this topic.
const ROUTES = {
    'community-events': [NOTIFICATION_URL],
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

const emitEvent = (topic, eventType, payload) => {
    const targets = ROUTES[topic];
    if (!targets) {
        console.warn(`[${SERVICE_NAME}] No HTTP route configured for topic ${topic}`);
        return;
    }
    // Fire-and-forget: don't return the promise so callers without await
    // continue immediately. Each target gets its own try/catch inside postEvent.
    targets.forEach((url) => {
        postEvent(url, topic, eventType, payload).catch(() => {});
    });
};

// Legacy compatibility: Kafka producer setup used to call `connectProducer()`
// from index.js. No-op now.
const connectProducer = async () => {};

module.exports = { emitEvent, connectProducer };
