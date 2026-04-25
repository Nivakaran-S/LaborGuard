/**
 * Cross-service event emitter — HTTP edition (no Kafka).
 *
 * Same `emitEvent(topic, type, payload)` signature so callers don't change.
 * POSTs to sibling services' `/api/internal/events/:topic` guarded by
 * `INTERNAL_SERVICE_SECRET`.
 *
 * Routing rules (messaging-service):
 *   messaging-events → notification-service (message_sent → email/in-app)
 */

const SERVICE_NAME = process.env.SERVICE_NAME || 'messaging-service';
const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:5004';
const SECRET = process.env.INTERNAL_SERVICE_SECRET || '';

const ROUTES = {
    'messaging-events': [NOTIFICATION_URL],
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
    targets.forEach((url) => {
        postEvent(url, topic, eventType, payload).catch(() => {});
    });
};

const connectProducer = async () => {}; // legacy no-op

module.exports = { emitEvent, connectProducer };
