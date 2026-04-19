const express = require('express');
const mongoose = require('mongoose');
const { Kafka } = require('kafkajs');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Environment variables
const PORT = process.env.PORT || 5001;
const SERVICE_NAME = process.env.SERVICE_NAME || 'auth-service';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/laborguard';
if (process.env.NODE_ENV === 'production' && !process.env.KAFKA_BROKER) {
  console.error(`[${SERVICE_NAME}] KAFKA_BROKER env var is required in production`);
  process.exit(1);
}
const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';

// MongoDB Connection
const connectMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME || 'laborguard-auth' });
    console.log(`[${SERVICE_NAME}] Connected to MongoDB`);
  } catch (error) {
    console.error(`[${SERVICE_NAME}] MongoDB connection error:`, error.message);
    setTimeout(connectMongoDB, 5000);
  }
};

// Kafka Setup
const kafka = new Kafka({
  clientId: SERVICE_NAME,
  brokers: [KAFKA_BROKER],
  retry: {
    initialRetryTime: 1000,
    retries: 10
  }
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: `${SERVICE_NAME}-group` });

const connectKafka = async () => {
  try {
    await producer.connect();
    console.log(`[${SERVICE_NAME}] Kafka producer connected`);

    await consumer.connect();
    console.log(`[${SERVICE_NAME}] Kafka consumer connected`);

    // Subscribe to relevant topics
    await consumer.subscribe({ topic: 'auth-events', fromBeginning: false });

    // Start consuming messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log(`[${SERVICE_NAME}] Received message from ${topic}:`, message.value.toString());
        // TODO: Handle incoming messages
      }
    });
  } catch (error) {
    console.error(`[${SERVICE_NAME}] Kafka connection error:`, error.message);
    setTimeout(connectKafka, 5000);
  }
};

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: SERVICE_NAME,
    timestamp: new Date().toISOString()
  });
});

// Root Endpoint
app.get('/', (req, res) => {
  res.json({
    service: SERVICE_NAME,
    description: 'Authentication and User Management Service',
    version: '1.0.0'
  });
});

// TODO: Add authentication routes
// app.post('/api/auth/register', ...)
// app.post('/api/auth/login', ...)
// app.get('/api/users', ...)

// Start server
const startServer = async () => {
  await connectMongoDB();
  await connectKafka();

  app.listen(PORT, () => {
    console.log(`[${SERVICE_NAME}] Server running on port ${PORT}`);
  });
};

startServer();
