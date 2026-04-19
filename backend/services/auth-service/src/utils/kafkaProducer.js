/**
 * kafkaProducer.js — Auth Service
 *
 * Publishes domain events from the auth-service to Kafka.
 * The community-service subscribes to the 'auth-events' topic and
 * listens for 'user_registered' to automatically create UserProfile documents.
 *
 * connectProducer() must be called once at startup (see server.js).
 */
const { Kafka } = require('kafkajs');

const SERVICE_NAME = process.env.SERVICE_NAME || 'auth-service';
const KAFKA_BROKER  = process.env.KAFKA_BROKER  || 'localhost:9092';

const kafka = new Kafka({
    clientId: SERVICE_NAME,
    brokers: [KAFKA_BROKER],
    retry: {
        initialRetryTime: 1000,
        retries: 5,
    },
});

const producer = kafka.producer();
let isConnected = false;

const connectProducer = async () => {
    if (isConnected) return;
    try {
        await producer.connect();
        isConnected = true;
        console.log(`[${SERVICE_NAME}] Kafka producer connected`);
    } catch (error) {
        // Non-fatal: app still works without Kafka, community UserProfiles
        // won't auto-create but no crash.
        console.error(`[${SERVICE_NAME}] Kafka producer connection error:`, error.message);
    }
};

const emitEvent = async (topic, eventType, payload) => {
    if (!isConnected) {
        console.warn(`[${SERVICE_NAME}] Kafka not connected — skipping event: ${eventType}`);
        return;
    }
    try {
        await producer.send({
            topic,
            messages: [{
                key   : eventType,
                value : JSON.stringify({ type: eventType, payload }),
            }],
        });
        console.log(`[${SERVICE_NAME}] Emitted event: ${eventType} → ${topic}`);
    } catch (error) {
        console.error(`[${SERVICE_NAME}] Failed to emit event ${eventType}:`, error.message);
    }
};

module.exports = { connectProducer, emitEvent };