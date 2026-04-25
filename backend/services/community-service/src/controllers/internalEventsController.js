/**
 * internalEventsController.js — community-service
 *
 * Handles 2 cross-service events delivered over HTTP (formerly via Kafka):
 *   auth-events / user_registered           → create UserProfile
 *   complaint-events / complaint_shared_to_community → create anonymous Post
 *
 * Producers POST `{ type, timestamp, payload }` to
 * `POST /api/internal/events/:topic`. Returns 202 immediately and processes
 * the event asynchronously, so producers fire-and-forget.
 */

const UserProfile = require('../models/UserProfile');
const Post = require('../models/Post');

const SERVICE_NAME = process.env.SERVICE_NAME || 'community-service';

const handleAuthEvents = async (event) => {
    if (event.type !== 'user_registered') return;
    const { userId, name, role } = event.payload;
    // auth-service emits 'ngo'; older clients may send 'ngo_representative'.
    const normalizedRole = role === 'ngo_representative' ? 'ngo' : role;

    const existing = await UserProfile.findOne({ userId });
    if (existing) return;
    const profile = new UserProfile({ userId, name, role: normalizedRole });
    await profile.save();
    console.log(`[${SERVICE_NAME}] Created profile for user ${userId}`);
};

const handleComplaintEvents = async (event) => {
    if (event.type !== 'complaint_shared_to_community') return;
    const { title, description, category, district, complaintId } = event.payload;
    const ANON_ID = 'anon-community';

    // Ensure the system profile exists for the "Anonymous Worker" account.
    await UserProfile.findOneAndUpdate(
        { userId: ANON_ID },
        {
            $setOnInsert: {
                userId: ANON_ID,
                name: 'Anonymous Worker',
                role: 'worker',
                isPrivate: false,
                avatarUrl: '',
                bio: 'Shared labour case — identifying details removed for privacy',
            },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const disclaimer = '[Shared from a filed case — identifying details removed]\n\n';
    const content = disclaimer + (title ? `${title}\n\n` : '') + (description || '');
    const hashtags = [category].filter(Boolean);
    if (district) hashtags.push(district.replace(/\s+/g, ''));

    await Post.create({
        authorId: ANON_ID,
        authorName: 'Anonymous Worker',
        authorAvatar: '',
        authorRole: 'worker',
        content,
        hashtags,
        mediaUrls: [],
    });
    console.log(`[${SERVICE_NAME}] Created anonymous community post from complaint ${complaintId}`);
};

const TOPIC_HANDLERS = {
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
        // Not an error — community-service simply doesn't care about this topic.
        return res.status(202).json({ accepted: false, reason: 'topic ignored' });
    }
    setImmediate(() => {
        handler(event).catch((err) => {
            console.error(`[${SERVICE_NAME}] handler error for ${topic}/${event.type}:`, err.message);
        });
    });
    res.status(202).json({ accepted: true, topic, type: event.type });
};
