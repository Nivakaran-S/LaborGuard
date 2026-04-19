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

const app = express();

// Middleware
app.use(cors());
app.use(helmet({
    contentSecurityPolicy: false
}));
app.use(express.json());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Environment variables
const PORT = process.env.PORT || 5004;
const SERVICE_NAME = process.env.SERVICE_NAME || 'notification-service';
const MONGODB_URI = process.env.MONGODB_URI;
if (process.env.NODE_ENV === 'production' && !process.env.KAFKA_BROKER) {
    console.error('[notification-service] KAFKA_BROKER env var is required in production');
    process.exit(1);
}
const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';

// MongoDB Connection
const connectMongoDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            dbName: process.env.MONGODB_DB_NAME || 'laborguard-notification'
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
        await consumer.subscribe({ topic: 'notification-events', fromBeginning: false });
        await consumer.subscribe({ topic: 'messaging-events', fromBeginning: false });
        await consumer.subscribe({ topic: 'community-events', fromBeginning: false });
        await consumer.subscribe({ topic: 'complaint-events', fromBeginning: false });

        // Start consuming messages
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const msgValue = message.value.toString();
                console.log(`[${SERVICE_NAME}] Received message from ${topic}:`, msgValue);

                try {
                    const event = JSON.parse(msgValue);
                    const Notification = require('./models/Notification');

                    if (topic === 'messaging-events' && event.type === 'message_sent') {
                        const { senderId, recipientIds, recipientEmails, contentPreview, conversationId, isGroup, groupName } = event.payload;
                        const { sendEmailNotification } = require('./utils/resendClient');

                        const title = isGroup ? `New message in ${groupName || 'Group'}` : `New message`;

                        // Create a notification for each recipient
                        const notifications = [];

                        for (const userId of recipientIds) {
                            notifications.push({
                                userId,
                                type: 'message',
                                title,
                                body: contentPreview,
                                relatedId: conversationId
                            });

                            // Only email if the producer supplied a real recipient email.
                            // Never fall back to a placeholder — silently skip instead.
                            const recipientEmail =
                                recipientEmails?.[userId] ||
                                (typeof recipientEmails === 'string' ? recipientEmails : null);
                            if (recipientEmail) {
                                await sendEmailNotification(
                                    recipientEmail,
                                    `LaborGuard: ${title}`,
                                    `<p>You have a new message on LaborGuard!</p><p><strong>${title}</strong></p><p><i>"${contentPreview}"</i></p>`
                                );
                            } else {
                                console.warn(`[${SERVICE_NAME}] Skipping email for ${userId} — no recipientEmail in payload`);
                            }
                        }

                        if (notifications.length > 0) {
                            await Notification.insertMany(notifications);
                            console.log(`[${SERVICE_NAME}] Created ${notifications.length} message notifications`);
                        }
                    } else if (topic === 'community-events') {
                        if (event.type === 'post_liked') {
                            const { likerId, authorId, postId } = event.payload;
                            await Notification.create({
                                userId: authorId,
                                type: 'system',
                                title: 'New Like',
                                body: `Someone liked your community post.`,
                                relatedId: postId
                            });
                            console.log(`[${SERVICE_NAME}] Created like notification for user ${authorId}`);
                        } else if (event.type === 'post_commented') {
                            const { commenterId, authorId, postId } = event.payload;
                            await Notification.create({
                                userId: authorId,
                                type: 'system',
                                title: 'New Comment',
                                body: `Someone commented on your community post.`,
                                relatedId: postId
                            });
                            console.log(`[${SERVICE_NAME}] Created comment notification for user ${authorId}`);
                        }
                    } else if (topic === 'complaint-events') {
                        if (event.type === 'complaint_status_updated') {
                            const { complaintId, workerId, newStatus, title } = event.payload;
                            const statusLabel = newStatus.replace('_', ' ').toUpperCase();
                            await Notification.create({
                                userId: workerId,
                                type: 'system',
                                title: 'Case Status Updated',
                                body: `Your case '${title}' has been updated to: ${statusLabel}.`,
                                relatedId: complaintId
                            });
                            console.log(`[${SERVICE_NAME}] Created status update notification for user ${workerId}`);
                        } else if (event.type === 'complaint_assigned') {
                            const { complaintId, officerId, title } = event.payload;
                            await Notification.create({
                                userId: officerId,
                                type: 'system',
                                title: 'New Case Assignment',
                                body: `You have been assigned to evaluate the case: '${title}'.`,
                                relatedId: complaintId
                            });
                            console.log(`[${SERVICE_NAME}] Created case assignment notification for officer ${officerId}`);
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
        description: 'Notification Service',
        version: '1.0.0'
    });
});

// Routes
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

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
