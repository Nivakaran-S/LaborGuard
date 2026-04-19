require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
const { Kafka } = require('kafkajs');
const cors = require('cors');
const helmet = require('helmet');
const UserProfile = require('./models/UserProfile');

const app = express();

app.use(cors());
app.use(helmet({
    contentSecurityPolicy: false
}));
app.use(express.json());




const PORT = process.env.PORT || 5002;
const SERVICE_NAME = process.env.SERVICE_NAME || 'community-service';
const MONGODB_URI = process.env.MONGODB_URI;
if (process.env.NODE_ENV === 'production' && !process.env.KAFKA_BROKER) {
    console.error('[community-service] KAFKA_BROKER env var is required in production');
    process.exit(1);
}
const KAFKA_BROKER = process.env.KAFKA_BROKER || 'kafka:9092';

const connectMongoDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            dbName: process.env.MONGODB_DB_NAME || 'laborguard-community'
        });
        console.log(`[${SERVICE_NAME}] Connected to MongoDB`);
    } catch (error) {
        console.error(`[${SERVICE_NAME}] MongoDB connection error:`, error.message);
        setTimeout(connectMongoDB, 5000);
    }
};


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

        await consumer.subscribe({ topic: 'community-events', fromBeginning: false });
        await consumer.subscribe({ topic: 'auth-events', fromBeginning: false });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const msgValue = message.value.toString();
                console.log(`[${SERVICE_NAME}] Received message from ${topic}:`, msgValue);

                try {
                    const event = JSON.parse(msgValue);
                    if (topic === 'auth-events' && event.type === 'user_registered') {
                        const { userId, name, role } = event.payload;

                        let profile = await UserProfile.findOne({ userId });
                        if (!profile) {
                            profile = new UserProfile({ userId, name, role });
                            await profile.save();
                            console.log(`[${SERVICE_NAME}] Created profile for user ${userId}`);
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

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: SERVICE_NAME,
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.json({
        service: SERVICE_NAME,
        description: 'Community Management Service',
        version: '1.0.0'
    });
});

const userProfileRoutes = require('./routes/userProfileRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const statusRoutes = require('./routes/statusRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Swagger API Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount routes
app.use('/api/profiles', userProfileRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/statuses', statusRoutes);
app.use('/api/reports', reportRoutes);

const startServer = async () => {
    await connectMongoDB();

    connectKafka().catch(err => {
        console.error(`[${SERVICE_NAME}] Kafka initial connection failed, will retry:`, err.message);
    });

    app.listen(PORT, () => {
        console.log(`[${SERVICE_NAME}] Server running on port ${PORT}`);
    });
};

startServer();

