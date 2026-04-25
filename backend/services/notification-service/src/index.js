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
        await consumer.subscribe({ topic: 'auth-events', fromBeginning: false });

        // Start consuming messages
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const msgValue = message.value.toString();
                console.log(`[${SERVICE_NAME}] Received message from ${topic}:`, msgValue);

                try {
                    const event = JSON.parse(msgValue);
                    const Notification = require('./models/Notification');
                    const { shouldNotify } = require('./utils/preferenceGate');
                    const { lookupUser } = require('./utils/userLookup');
                    const { sendEmailNotification } = require('./utils/resendClient');

                    /**
                     * Create in-app notification + optionally email, honouring user prefs.
                     * Email is opt-in (emailEnabled defaults false on NotificationPreference)
                     * and further gated per-type. Looks up the recipient's email from
                     * auth-service via userLookup (5-min cached).
                     */
                    const createIfAllowed = async (typeKey, notification, emailPayload = null) => {
                        const [inAppOk, emailOk] = await Promise.all([
                            shouldNotify(notification.userId, typeKey, 'inApp'),
                            emailPayload ? shouldNotify(notification.userId, typeKey, 'email') : Promise.resolve(false),
                        ]);

                        let created = null;
                        if (inAppOk) {
                            created = await Notification.create(notification);
                        }

                        if (emailOk && emailPayload) {
                            const user = await lookupUser(notification.userId);
                            if (user?.email) {
                                const greet = user.firstName ? `Hi ${user.firstName}` : 'Hi there';
                                await sendEmailNotification(
                                    user.email,
                                    `LaborGuard: ${emailPayload.subject || notification.title}`,
                                    `<p>${greet},</p>
                                     <p>${emailPayload.bodyHtml || notification.body}</p>
                                     ${emailPayload.cta ? `<p><a href="${emailPayload.cta.href}" style="background:#0d9488;color:#fff;padding:10px 20px;border-radius:24px;text-decoration:none;font-weight:bold;">${emailPayload.cta.label}</a></p>` : ''}
                                     <hr/>
                                     <p style="color:#888;font-size:12px;">You're receiving this because email notifications are enabled for this event. Manage your preferences in LaborGuard → Notifications → Settings.</p>`
                                );
                            }
                        }

                        return created;
                    };

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
                        const appUrl = process.env.APP_URL || 'https://labor-guard.vercel.app';

                        if (event.type === 'post_liked') {
                            const { authorId, postId } = event.payload;
                            await createIfAllowed('post_liked', {
                                userId: authorId,
                                type: 'system',
                                title: 'New Like',
                                body: 'Someone liked your community post.',
                                relatedId: postId,
                            }, {
                                subject: 'Your post got a new like',
                                bodyHtml: 'Someone just liked your post. See who\'s engaging with your content.',
                                cta: { label: 'View Post', href: `${appUrl}/community?post=${postId}` },
                            });
                        } else if (event.type === 'post_commented') {
                            const { authorId, postId } = event.payload;
                            await createIfAllowed('post_commented', {
                                userId: authorId,
                                type: 'system',
                                title: 'New Comment',
                                body: 'Someone commented on your community post.',
                                relatedId: postId,
                            }, {
                                subject: 'New comment on your post',
                                bodyHtml: 'Someone left a comment on your community post. Join the conversation.',
                                cta: { label: 'Open Post', href: `${appUrl}/community?post=${postId}` },
                            });
                        } else if (event.type === 'user_followed') {
                            const { followerId, targetUserId } = event.payload;
                            await createIfAllowed('user_followed', {
                                userId: targetUserId,
                                type: 'system',
                                title: 'New Follower',
                                body: 'Someone started following you.',
                                relatedId: followerId,
                            }, {
                                subject: 'You have a new follower',
                                bodyHtml: 'Someone just followed you on LaborGuard Community.',
                                cta: { label: 'See Profile', href: `${appUrl}/community/profile/${followerId}` },
                            });
                        } else if (event.type === 'follow_requested') {
                            const { requesterId, targetUserId } = event.payload;
                            await createIfAllowed('follow_requested', {
                                userId: targetUserId,
                                type: 'system',
                                title: 'Follow Request',
                                body: 'Someone requested to follow you.',
                                relatedId: requesterId,
                            }, {
                                subject: 'New follow request',
                                bodyHtml: 'Someone requested to follow your private profile. Approve or reject them in LaborGuard.',
                                cta: { label: 'Review Request', href: `${appUrl}/community/follow-requests` },
                            });
                        } else if (event.type === 'follow_request_approved') {
                            const { requesterId, targetUserId } = event.payload;
                            await createIfAllowed('follow_request_approved', {
                                userId: requesterId,
                                type: 'system',
                                title: 'Follow Request Approved',
                                body: 'Your follow request was approved.',
                                relatedId: targetUserId,
                            }, {
                                subject: 'Your follow request was approved',
                                bodyHtml: 'You can now see posts from this user.',
                                cta: { label: 'View Profile', href: `${appUrl}/community/profile/${targetUserId}` },
                            });
                        } else if (event.type === 'campaign_supported') {
                            const { creatorId, campaignId, title } = event.payload;
                            await createIfAllowed('campaign_supported', {
                                userId: creatorId,
                                type: 'system',
                                title: 'Campaign Support',
                                body: `A new person is supporting '${title}'.`,
                                relatedId: campaignId,
                            }, {
                                subject: `New supporter for '${title}'`,
                                bodyHtml: `Your campaign "<strong>${title}</strong>" just gained a new supporter.`,
                                cta: { label: 'View Campaign', href: `${appUrl}/community/campaigns/${campaignId}` },
                            });
                        } else if (event.type === 'campaign_update_posted') {
                            const { campaignId, supporters = [], title, postId } = event.payload;
                            if (supporters.length > 0) {
                                // Parallel per-supporter fan-out: in-app + optional email.
                                const results = await Promise.all(
                                    supporters.map(async (uid) => {
                                        const [inAppOk, emailOk] = await Promise.all([
                                            shouldNotify(uid, 'campaign_update', 'inApp'),
                                            shouldNotify(uid, 'campaign_update', 'email'),
                                        ]);
                                        const notif = inAppOk ? {
                                            userId: uid,
                                            type: 'system',
                                            title: 'Campaign Update',
                                            body: `'${title}' has a new update.`,
                                            relatedId: postId || campaignId,
                                        } : null;
                                        return { uid, notif, emailOk };
                                    })
                                );
                                const toInsert = results.map((r) => r.notif).filter(Boolean);
                                if (toInsert.length) {
                                    await Notification.insertMany(toInsert);
                                    console.log(`[${SERVICE_NAME}] Fan-out campaign update (in-app) to ${toInsert.length} supporters`);
                                }

                                // Email fan-out — also parallel, but limited to those who opted in.
                                const emailJobs = results
                                    .filter((r) => r.emailOk)
                                    .map(async ({ uid }) => {
                                        const user = await lookupUser(uid);
                                        if (!user?.email) return;
                                        const greet = user.firstName ? `Hi ${user.firstName}` : 'Hi there';
                                        await sendEmailNotification(
                                            user.email,
                                            `LaborGuard: Update on '${title}'`,
                                            `<p>${greet},</p>
                                             <p>The campaign "<strong>${title}</strong>" you support just posted a new update.</p>
                                             <p><a href="${appUrl}/community/campaigns/${campaignId}" style="background:#0d9488;color:#fff;padding:10px 20px;border-radius:24px;text-decoration:none;font-weight:bold;">Read Update</a></p>
                                             <hr/>
                                             <p style="color:#888;font-size:12px;">Manage campaign email alerts in LaborGuard → Notifications → Settings.</p>`
                                        );
                                    });
                                await Promise.allSettled(emailJobs);
                            }
                        } else if (event.type === 'report_resolved') {
                            const { reporterId, targetType, targetId } = event.payload;
                            await createIfAllowed('report_resolved', {
                                userId: reporterId,
                                type: 'system',
                                title: 'Report Resolved',
                                body: `Your report on a ${targetType} has been reviewed and resolved.`,
                                relatedId: targetId,
                            }, {
                                subject: 'Your report has been resolved',
                                bodyHtml: `Thanks for keeping the community safe. Your report on a ${targetType} has been reviewed and resolved.`,
                            });
                        }
                    } else if (topic === 'auth-events') {
                        // Moderation notifications bypass user preferences (too important to silence),
                        // but email still respects opt-in / account-level emailEnabled.
                        const sendModerationEmail = async (userId, subject, body) => {
                            try {
                                const shouldEmail = await shouldNotify(userId, 'user_warned', 'email');
                                if (!shouldEmail) return;
                                const user = await lookupUser(userId);
                                if (!user?.email) return;
                                const greet = user.firstName ? `Hi ${user.firstName}` : 'Hi there';
                                await sendEmailNotification(
                                    user.email,
                                    `LaborGuard: ${subject}`,
                                    `<p>${greet},</p><p>${body}</p><hr/><p style="color:#888;font-size:12px;">If you believe this was a mistake, please contact support.</p>`
                                );
                            } catch (err) {
                                console.error(`[${SERVICE_NAME}] Moderation email failed:`, err.message);
                            }
                        };

                        if (event.type === 'user_warned') {
                            const { userId, reason } = event.payload;
                            await Notification.create({
                                userId,
                                type: 'alert',
                                title: 'Community Warning',
                                body: reason || 'You have received a moderation warning.',
                                relatedId: null,
                            });
                            await sendModerationEmail(userId, 'Community Warning', reason || 'You have received a moderation warning for violating our community guidelines.');
                        } else if (event.type === 'user_suspended') {
                            const { userId, reason, suspendedUntil } = event.payload;
                            const untilStr = suspendedUntil ? ` until ${new Date(suspendedUntil).toLocaleDateString()}` : '';
                            await Notification.create({
                                userId,
                                type: 'alert',
                                title: 'Account Suspended',
                                body: `Your account is suspended${untilStr}. ${reason || ''}`.trim(),
                                relatedId: null,
                            });
                            await sendModerationEmail(userId, 'Account Suspended', `Your account has been suspended${untilStr}. ${reason || ''}`.trim());
                        } else if (event.type === 'user_banned') {
                            const { userId, reason } = event.payload;
                            await Notification.create({
                                userId,
                                type: 'alert',
                                title: 'Account Banned',
                                body: reason || 'Your account has been permanently banned.',
                                relatedId: null,
                            });
                            await sendModerationEmail(userId, 'Account Banned', reason || 'Your account has been permanently banned from LaborGuard.');
                        }
                    } else if (topic === 'complaint-events') {
                        if (event.type === 'complaint_status_updated') {
                            const { complaintId, workerId, newStatus, title } = event.payload;
                            const statusLabel = newStatus.replace('_', ' ').toUpperCase();
                            await createIfAllowed('complaint_status', {
                                userId: workerId,
                                type: 'system',
                                title: 'Case Status Updated',
                                body: `Your case '${title}' has been updated to: ${statusLabel}.`,
                                relatedId: complaintId
                            }, {
                                subject: `Case update: ${title}`,
                                bodyHtml: `Your case "<strong>${title}</strong>" has been updated. New status: <strong>${statusLabel}</strong>.`,
                                cta: { label: 'View Case', href: `${process.env.APP_URL || 'https://labor-guard.vercel.app'}/complaints/${complaintId}` },
                            });
                            console.log(`[${SERVICE_NAME}] Created status update notification for user ${workerId}`);
                        } else if (event.type === 'complaint_assigned') {
                            const { complaintId, officerId, title } = event.payload;
                            await createIfAllowed('complaint_status', {
                                userId: officerId,
                                type: 'system',
                                title: 'New Case Assignment',
                                body: `You have been assigned to evaluate the case: '${title}'.`,
                                relatedId: complaintId
                            }, {
                                subject: `New case assigned: ${title}`,
                                bodyHtml: `You've been assigned to case "<strong>${title}</strong>". Review the details and begin your work.`,
                                cta: { label: 'Open Case', href: `${process.env.APP_URL || 'https://labor-guard.vercel.app'}/legal/cases/${complaintId}` },
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
