const { Kafka } = require('kafkajs');

const SERVICE_NAME = process.env.SERVICE_NAME || 'notification-service';
const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';

const kafka = new Kafka({
    clientId: SERVICE_NAME,
    brokers: [KAFKA_BROKER],
    retry: {
        initialRetryTime: 1000,
        retries: 10
    }
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
        console.error(`[${SERVICE_NAME}] Event producer connection error:`, error.message);
    }
};

const emitEvent = async (topic, eventType, payload) => {
    if (!isConnected) await connectProducer();

    try {
        const message = {
            type: eventType,
            timestamp: new Date().toISOString(),
            payload
        };

        await producer.send({
            topic,
            messages: [
                { value: JSON.stringify(message) }
            ]
        });

        console.log(`[${SERVICE_NAME}] Emitted ${eventType} to topic ${topic}`);
    } catch (error) {
        console.error(`[${SERVICE_NAME}] Failed to emit event:`, error.message);
    }
};

module.exports = {
    connectProducer,
    emitEvent
};
