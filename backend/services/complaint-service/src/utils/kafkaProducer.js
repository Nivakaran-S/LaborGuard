/**
 * Cross-service event emitter — HTTP edition (no Kafka).
 *
 * Same `emitEvent(topic, type, payload)` signature so callers don't change.
 * POSTs to sibling services' `/api/internal/events/:topic` guarded by
 * `INTERNAL_SERVICE_SECRET`.
 *
 * Routing rules (complaint-service):
 *   complaint-events → notification-service (status_updated, assigned)
 *                    → community-service    (complaint_shared_to_community → anon post)
 */

const SERVICE_NAME = process.env.SERVICE_NAME || 'complaint-service';
const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:5004';
const COMMUNITY_URL    = process.env.COMMUNITY_SERVICE_URL    || 'http://community-service:5002';
const MESSAGING_URL    = process.env.MESSAGING_SERVICE_URL    || 'http://messaging-service:5005';
const SECRET = process.env.INTERNAL_SERVICE_SECRET || '';

// complaint-events consumers:
//   notification-service   → status_updated, assigned (notifications)
//   community-service      → complaint_shared_to_community (anon post)
//   messaging-service      → complaint_assigned (auto-create conversation)
const ROUTES = {
    'complaint-events': [NOTIFICATION_URL, COMMUNITY_URL, MESSAGING_URL],
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

// Returns a never-rejecting Promise so callers can await/.catch/.then or
// fire-and-forget interchangeably.
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

const connectProducer = async () => {}; // legacy no-op

module.exports = { emitEvent, connectProducer };
