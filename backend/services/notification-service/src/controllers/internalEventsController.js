/**
 * internalEventsController.js
 *
 * Handles cross-service events delivered over HTTP. Replaces the old Kafka
 * `eachMessage` switch verbatim — same payload shapes, same notification +
 * email fan-out logic. Producers POST `{ type, timestamp, payload }` to
 * `POST /api/internal/events/:topic`, guarded by `INTERNAL_SERVICE_SECRET`.
 *
 * Returns 202 Accepted as soon as we've handed the event off to the async
 * dispatcher — producers fire-and-forget so we don't make them wait.
 */

const Notification = require('../models/Notification');
const { shouldNotify } = require('../utils/preferenceGate');
const { lookupUser } = require('../utils/userLookup');
const { sendEmailNotification } = require('../utils/resendClient');
const { publishToChannel } = require('../utils/centrifugoClient');

const SERVICE_NAME = process.env.SERVICE_NAME || 'notification-service';
const APP_URL = process.env.APP_URL || 'https://labor-guard.vercel.app';

/**
 * Push the freshly-saved notification to the recipient's personal Centrifugo
 * channel so the unread badge updates instantly. Fire-and-forget — the
 * channel publish is best-effort; the polling fallback in the frontend
 * covers the case where Centrifugo is unreachable.
 */
const pushRealtime = (notification) => {
    if (!notification?.userId) return;
    publishToChannel(`notifications:${notification.userId}`, {
        type: 'new_notification',
        notification,
    }).catch(() => { /* logged inside publishToChannel */ });
};

/**
 * Create in-app notification + optionally email, honouring user prefs.
 * Email is opt-in (emailEnabled defaults false) and gated per-type.
 */
const createIfAllowed = async (typeKey, notification, emailPayload = null) => {
    const [inAppOk, emailOk] = await Promise.all([
        shouldNotify(notification.userId, typeKey, 'inApp'),
        emailPayload ? shouldNotify(notification.userId, typeKey, 'email') : Promise.resolve(false),
    ]);

    let created = null;
    if (inAppOk) {
        created = await Notification.create(notification);
        pushRealtime(created);
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

const handleMessagingEvents = async (event) => {
    if (event.type !== 'message_sent') return;
    const { recipientIds, recipientEmails, contentPreview, conversationId, isGroup, groupName } = event.payload;
    const title = isGroup ? `New message in ${groupName || 'Group'}` : `New message`;
    const notifications = [];

    for (const userId of recipientIds) {
        notifications.push({
            userId,
            type: 'message',
            category: 'message',
            title,
            body: contentPreview,
            relatedId: conversationId,
        });

        const recipientEmail =
            recipientEmails?.[userId] ||
            (typeof recipientEmails === 'string' ? recipientEmails : null);
        if (recipientEmail) {
            await sendEmailNotification(
                recipientEmail,
                `LaborGuard: ${title}`,
                `<p>You have a new message on LaborGuard!</p><p><strong>${title}</strong></p><p><i>"${contentPreview}"</i></p>`
            );
        }
    }

    if (notifications.length > 0) {
        const inserted = await Notification.insertMany(notifications);
        inserted.forEach((n) => pushRealtime(n));
        console.log(`[${SERVICE_NAME}] Created ${notifications.length} message notifications`);
    }
};

const handleCommunityEvents = async (event) => {
    if (event.type === 'post_liked') {
        const { authorId, postId } = event.payload;
        await createIfAllowed('post_liked', {
            userId: authorId, type: 'system', category: 'community', title: 'New Like',
            body: 'Someone liked your community post.', relatedId: postId,
        }, {
            subject: 'Your post got a new like',
            bodyHtml: 'Someone just liked your post. See who\'s engaging with your content.',
            cta: { label: 'View Post', href: `${APP_URL}/community?post=${postId}` },
        });
    } else if (event.type === 'post_commented') {
        const { authorId, postId } = event.payload;
        await createIfAllowed('post_commented', {
            userId: authorId, type: 'system', category: 'community', title: 'New Comment',
            body: 'Someone commented on your community post.', relatedId: postId,
        }, {
            subject: 'New comment on your post',
            bodyHtml: 'Someone left a comment on your community post. Join the conversation.',
            cta: { label: 'Open Post', href: `${APP_URL}/community?post=${postId}` },
        });
    } else if (event.type === 'user_followed') {
        const { followerId, targetUserId } = event.payload;
        await createIfAllowed('user_followed', {
            userId: targetUserId, type: 'system', category: 'community', title: 'New Follower',
            body: 'Someone started following you.', relatedId: followerId,
        }, {
            subject: 'You have a new follower',
            bodyHtml: 'Someone just followed you on LaborGuard Community.',
            cta: { label: 'See Profile', href: `${APP_URL}/community/profile/${followerId}` },
        });
    } else if (event.type === 'follow_requested') {
        const { requesterId, targetUserId } = event.payload;
        await createIfAllowed('follow_requested', {
            userId: targetUserId, type: 'system', category: 'community', title: 'Follow Request',
            body: 'Someone requested to follow you.', relatedId: requesterId,
        }, {
            subject: 'New follow request',
            bodyHtml: 'Someone requested to follow your private profile. Approve or reject them in LaborGuard.',
            cta: { label: 'Review Request', href: `${APP_URL}/community/follow-requests` },
        });
    } else if (event.type === 'follow_request_approved') {
        const { requesterId, targetUserId } = event.payload;
        await createIfAllowed('follow_request_approved', {
            userId: requesterId, type: 'system', category: 'community', title: 'Follow Request Approved',
            body: 'Your follow request was approved.', relatedId: targetUserId,
        }, {
            subject: 'Your follow request was approved',
            bodyHtml: 'You can now see posts from this user.',
            cta: { label: 'View Profile', href: `${APP_URL}/community/profile/${targetUserId}` },
        });
    } else if (event.type === 'campaign_supported') {
        const { creatorId, campaignId, title } = event.payload;
        await createIfAllowed('campaign_supported', {
            userId: creatorId, type: 'system', category: 'community', title: 'Campaign Support',
            body: `A new person is supporting '${title}'.`, relatedId: campaignId,
        }, {
            subject: `New supporter for '${title}'`,
            bodyHtml: `Your campaign "<strong>${title}</strong>" just gained a new supporter.`,
            cta: { label: 'View Campaign', href: `${APP_URL}/community/campaigns/${campaignId}` },
        });
    } else if (event.type === 'campaign_update_posted') {
        const { campaignId, supporters = [], title, postId } = event.payload;
        if (!supporters.length) return;
        const results = await Promise.all(
            supporters.map(async (uid) => {
                const [inAppOk, emailOk] = await Promise.all([
                    shouldNotify(uid, 'campaign_update', 'inApp'),
                    shouldNotify(uid, 'campaign_update', 'email'),
                ]);
                const notif = inAppOk ? {
                    userId: uid, type: 'system', category: 'community', title: 'Campaign Update',
                    body: `'${title}' has a new update.`, relatedId: postId || campaignId,
                } : null;
                return { uid, notif, emailOk };
            })
        );
        const toInsert = results.map((r) => r.notif).filter(Boolean);
        if (toInsert.length) {
            const inserted = await Notification.insertMany(toInsert);
            inserted.forEach((n) => pushRealtime(n));
            console.log(`[${SERVICE_NAME}] Fan-out campaign update (in-app) to ${toInsert.length} supporters`);
        }
        const emailJobs = results.filter((r) => r.emailOk).map(async ({ uid }) => {
            const user = await lookupUser(uid);
            if (!user?.email) return;
            const greet = user.firstName ? `Hi ${user.firstName}` : 'Hi there';
            await sendEmailNotification(
                user.email,
                `LaborGuard: Update on '${title}'`,
                `<p>${greet},</p>
                 <p>The campaign "<strong>${title}</strong>" you support just posted a new update.</p>
                 <p><a href="${APP_URL}/community/campaigns/${campaignId}" style="background:#0d9488;color:#fff;padding:10px 20px;border-radius:24px;text-decoration:none;font-weight:bold;">Read Update</a></p>
                 <hr/>
                 <p style="color:#888;font-size:12px;">Manage campaign email alerts in LaborGuard → Notifications → Settings.</p>`
            );
        });
        await Promise.allSettled(emailJobs);
    } else if (event.type === 'report_resolved') {
        const { reporterId, targetType, targetId } = event.payload;
        await createIfAllowed('report_resolved', {
            userId: reporterId, type: 'system', category: 'community', title: 'Report Resolved',
            body: `Your report on a ${targetType} has been reviewed and resolved.`,
            relatedId: targetId,
        }, {
            subject: 'Your report has been resolved',
            bodyHtml: `Thanks for keeping the community safe. Your report on a ${targetType} has been reviewed and resolved.`,
        });
    }
};

const handleAuthEvents = async (event) => {
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
        const notif = await Notification.create({
            userId, type: 'alert', category: 'moderation', title: 'Community Warning',
            body: reason || 'You have received a moderation warning.', relatedId: null,
        });
        pushRealtime(notif);
        await sendModerationEmail(userId, 'Community Warning', reason || 'You have received a moderation warning for violating our community guidelines.');
    } else if (event.type === 'user_suspended') {
        const { userId, reason, suspendedUntil } = event.payload;
        const untilStr = suspendedUntil ? ` until ${new Date(suspendedUntil).toLocaleDateString()}` : '';
        const notif = await Notification.create({
            userId, type: 'alert', category: 'moderation', title: 'Account Suspended',
            body: `Your account is suspended${untilStr}. ${reason || ''}`.trim(), relatedId: null,
        });
        pushRealtime(notif);
        await sendModerationEmail(userId, 'Account Suspended', `Your account has been suspended${untilStr}. ${reason || ''}`.trim());
    } else if (event.type === 'user_banned') {
        const { userId, reason } = event.payload;
        const notif = await Notification.create({
            userId, type: 'alert', category: 'moderation', title: 'Account Banned',
            body: reason || 'Your account has been permanently banned.', relatedId: null,
        });
        pushRealtime(notif);
        await sendModerationEmail(userId, 'Account Banned', reason || 'Your account has been permanently banned from LaborGuard.');
    }
    // user_registered is consumed by community-service, not here.
};

const handleComplaintEvents = async (event) => {
    if (event.type === 'complaint_status_updated') {
        const { complaintId, workerId, newStatus, title } = event.payload;
        const statusLabel = String(newStatus || '').replace('_', ' ').toUpperCase();
        await createIfAllowed('complaint_status', {
            userId: workerId, type: 'system', category: 'complaint', title: 'Case Status Updated',
            body: `Your case '${title}' has been updated to: ${statusLabel}.`,
            relatedId: complaintId,
        }, {
            subject: `Case update: ${title}`,
            bodyHtml: `Your case "<strong>${title}</strong>" has been updated. New status: <strong>${statusLabel}</strong>.`,
            cta: { label: 'View Case', href: `${APP_URL}/complaints/${complaintId}` },
        });
    } else if (event.type === 'complaint_assigned') {
        const { complaintId, officerId, title } = event.payload;
        await createIfAllowed('complaint_status', {
            userId: officerId, type: 'system', category: 'complaint', title: 'New Case Assignment',
            body: `You have been assigned to evaluate the case: '${title}'.`,
            relatedId: complaintId,
        }, {
            subject: `New case assigned: ${title}`,
            bodyHtml: `You've been assigned to case "<strong>${title}</strong>". Review the details and begin your work.`,
            cta: { label: 'Open Case', href: `${APP_URL}/legal/cases/${complaintId}` },
        });
    } else if (event.type === 'appointment_auto_booked') {
        // Auto-booking via "Update Status → under_review" used to only send
        // emails. This handler adds the in-app notification path so both the
        // worker and the assigned officer get a bell badge.
        const { appointmentId, complaintId, workerId, officerId, title, scheduledAt } = event.payload;
        const when = scheduledAt ? new Date(scheduledAt).toLocaleString() : '';
        await createIfAllowed('complaint_status', {
            userId: workerId, type: 'system', category: 'complaint', title: 'Appointment Booked',
            body: `An appointment has been auto-booked for your case '${title}'${when ? ` on ${when}` : ''}.`,
            relatedId: appointmentId,
        }, {
            subject: `Appointment booked for '${title}'`,
            bodyHtml: `An appointment has been booked for your case "<strong>${title}</strong>"${when ? ` on <strong>${when}</strong>` : ''}.`,
            cta: { label: 'View Appointment', href: `${APP_URL}/worker/appointments` },
        });
        await createIfAllowed('complaint_status', {
            userId: officerId, type: 'system', category: 'complaint', title: 'New Case Assignment',
            body: `Auto-assigned to case '${title}'${when ? `; appointment on ${when}` : ''}.`,
            relatedId: complaintId,
        }, {
            subject: `New case assigned: ${title}`,
            bodyHtml: `You've been auto-assigned to case "<strong>${title}</strong>"${when ? ` with an appointment on <strong>${when}</strong>` : ''}.`,
            cta: { label: 'Open Case', href: `${APP_URL}/legal/cases/${complaintId}` },
        });
    } else if (event.type === 'appointment_requested') {
        // Worker requested a manual appointment. Admin needs to know so they
        // can confirm it (and assign an officer at confirm time). No
        // role-based fanout exists yet, so for now we leave the in-app
        // notification empty and rely on admin checking the appointments
        // page filter; logged for visibility.
        const { complaintId, title, workerId } = event.payload;
        console.log(`[${SERVICE_NAME}] appointment_requested for complaint ${complaintId} (${title}) by worker ${workerId}`);
    }
    // complaint_shared_to_community is consumed by community-service, not here.
};

const TOPIC_HANDLERS = {
    'messaging-events': handleMessagingEvents,
    'community-events': handleCommunityEvents,
    'auth-events':      handleAuthEvents,
    'complaint-events': handleComplaintEvents,
};

/**
 * POST /api/internal/events/:topic
 * Body: { type, timestamp, payload }
 */
exports.dispatchEvent = async (req, res) => {
    const { topic } = req.params;
    const event = req.body;
    if (!event?.type) {
        return res.status(400).json({ message: 'Missing event.type in body' });
    }
    const handler = TOPIC_HANDLERS[topic];
    if (!handler) {
        console.warn(`[${SERVICE_NAME}] No handler for topic ${topic}`);
        return res.status(202).json({ accepted: false, reason: 'unknown topic' });
    }

    // Process async — return 202 immediately so the producer never blocks on us.
    setImmediate(() => {
        handler(event).catch((err) => {
            console.error(`[${SERVICE_NAME}] handler error for ${topic}/${event.type}:`, err.message);
        });
    });
    res.status(202).json({ accepted: true, topic, type: event.type });
};
