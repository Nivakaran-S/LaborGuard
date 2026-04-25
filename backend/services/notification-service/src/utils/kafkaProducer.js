/**
 * Cross-service event emitter — HTTP edition (no Kafka).
 *
 * notification-service is currently a consumer-only service (it doesn't emit
 * cross-service events anywhere). This module remains as a no-op shim so the
 * `const { emitEvent } = require('../utils/kafkaProducer')` import in
 * notificationController.js keeps resolving — and so any future producer code
 * has the same `emitEvent(topic, type, payload)` signature available.
 */

const SERVICE_NAME = process.env.SERVICE_NAME || 'notification-service';

const emitEvent = (topic, eventType /* , payload */) => {
    // No-op: notification-service has no downstream consumers today.
    console.log(`[${SERVICE_NAME}] emitEvent called (no-op): ${topic}/${eventType}`);
};

const connectProducer = async () => {}; // legacy no-op

module.exports = { emitEvent, connectProducer };
