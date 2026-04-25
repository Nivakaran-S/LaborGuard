/**
 * internalEventsController.js — messaging-service
 *
 * Handles the one cross-service event messaging cares about (formerly via Kafka):
 *   complaint-events / complaint_assigned → auto-create a worker↔lawyer conversation
 *
 * Returns 202 immediately and processes async — producer fire-and-forget.
 */

const Conversation = require('../models/Conversation');

const SERVICE_NAME = process.env.SERVICE_NAME || 'messaging-service';

const handleComplaintEvents = async (event) => {
    if (event.type !== 'complaint_assigned') return;
    const { complaintId, officerId, workerId, title } = event.payload;

    // De-dup: one conversation per case.
    const existing = await Conversation.findOne({ relatedCaseId: complaintId });
    if (existing) return;

    const conv = new Conversation({
        participants: [workerId, officerId],
        participantRoles: [
            { userId: workerId, role: 'worker' },
            { userId: officerId, role: 'lawyer' },
        ],
        isGroup: false,
        relatedCaseId: complaintId,
        lastMessage: {
            senderId: 'system',
            content: `Case '${title}' encrypted vault established.`,
            timestamp: new Date(),
        },
    });
    await conv.save();
    console.log(`[${SERVICE_NAME}] Auto-created conversation for Case ID ${complaintId}`);
};

const TOPIC_HANDLERS = {
    'complaint-events': handleComplaintEvents,
};

exports.dispatchEvent = async (req, res) => {
    const { topic } = req.params;
    const event = req.body;
    if (!event?.type) {
        return res.status(400).json({ message: 'Missing event.type in body' });
    }
    const handler = TOPIC_HANDLERS[topic];
    if (!handler) {
        return res.status(202).json({ accepted: false, reason: 'topic ignored' });
    }
    setImmediate(() => {
        handler(event).catch((err) => {
            console.error(`[${SERVICE_NAME}] handler error for ${topic}/${event.type}:`, err.message);
        });
    });
    res.status(202).json({ accepted: true, topic, type: event.type });
};
