const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const { Kafka } = require('kafkajs');
const cors = require('cors');
const helmet = require('helmet');
const messageRoutes = require('./routes/messageRoutes');

require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(helmet({
    contentSecurityPolicy: false
}));
app.use(express.json());

// Swagger Documentation
const swaggerDocument = YAML.load(path.join(__dirname, '..', 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Environment variables
const PORT = process.env.PORT || 5005;
const SERVICE_NAME = process.env.SERVICE_NAME || 'messaging-service';
const MONGODB_URI = process.env.MONGODB_URI;
if (process.env.NODE_ENV === 'production' && !process.env.KAFKA_BROKER) {
    console.error('[messaging-service] KAFKA_BROKER env var is required in production');
    process.exit(1);
}
const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';

// MongoDB Connection
const connectMongoDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            dbName: process.env.MONGODB_DB_NAME || 'laborguard-messaging'
        });
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
        await consumer.subscribe({ topic: 'messaging-events', fromBeginning: false });
        await consumer.subscribe({ topic: 'complaint-events', fromBeginning: false });

        // Start consuming messages
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const msgValue = message.value.toString();
                console.log(`[${SERVICE_NAME}] Received message from ${topic}:`, msgValue);
                
                try {
                    const event = JSON.parse(msgValue);
                    
                    if (topic === 'complaint-events' && event.type === 'complaint_assigned') {
                        const { complaintId, officerId, workerId, title } = event.payload;
                        const Conversation = require('./models/Conversation');
                        
                        // Check if conversation already exists for this case
                        const existingConv = await Conversation.findOne({ relatedCaseId: complaintId });
                        
                        if (!existingConv) {
                            const newConversation = new Conversation({
                                participants: [workerId, officerId],
                                participantRoles: [
                                    { userId: workerId, role: 'worker' },
                                    { userId: officerId, role: 'lawyer' } // Or ngo_representative, etc.
                                ],
                                isGroup: false,
                                relatedCaseId: complaintId,
                                lastMessage: {
                                    senderId: "system",
                                    content: `Case '${title}' encrypted vault established.`,
                                    timestamp: new Date()
                                }
                            });
                            
                            await newConversation.save();
                            console.log(`[${SERVICE_NAME}] Auto-created conversation for Case ID ${complaintId}`);
                        }
                    }
                } catch (err) {
                    console.error(`[${SERVICE_NAME}] Error processing message:`, err.message);
                }
            }
        });
    } catch (error) {
        console.error(`[${SERVICE_NAME}] Kafka connection error:`, error.message);
        setTimeout(connectKafka, 5000);
    }
};

// Injection of kafka producer into req
app.use((req, res, next) => {
    req.producer = producer;
    next();
});

// Routes
app.use('/api', messageRoutes);
app.use('/api/messages', messageRoutes); // Supporting both prefixes if needed

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
        description: 'Actor-to-Actor Messaging Service',
        version: '1.0.0'
    });
});

// Start server
const startServer = async () => {
    await connectMongoDB();

    // Connect to Kafka but don't block server startup if it fails initially
    connectKafka().catch(err => {
        console.error(`[${SERVICE_NAME}] Kafka initial connection failed, will retry:`, err.message);
    });

    app.listen(PORT, () => {
        console.log(`[${SERVICE_NAME}] Server running on port ${PORT}`);
    });
};

startServer();
