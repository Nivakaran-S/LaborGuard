/**
 * statusController.js — Community Service
 *
 * FIXES APPLIED:
 *  [AUTH-1]  authorId always from req.user.userId (JWT) — never req.body
 *  [PERF-1]  getStatuses: server-side $or query — no [...following, userId] spread
 *  [PERF-2]  .lean() on read-only queries
 *  [ROBUST]  deleteStatus: type-safe authorId comparison (.toString())
 *            Admin override for delete
 */

const Status      = require('../models/Status');
const UserProfile = require('../models/UserProfile');
const { uploadToCloudinary } = require('../utils/cloudinaryConfig');

// ── createStatus ──────────────────────────────────────────────────────────────
exports.createStatus = async (req, res) => {
    try {
        const authorId  = req.user.userId;                         // [AUTH-1]
        const { content } = req.body;

        let mediaUrl = '';
        if (req.file?.buffer) {
            const result = await uploadToCloudinary(req.file.buffer);
            mediaUrl = result.secure_url;
        } else if (req.body.mediaUrl) {
            mediaUrl = req.body.mediaUrl;
        }

        if (!content?.trim() && !mediaUrl) {
            return res.status(400).json({ message: 'Status must have content or media' });
        }

        const status = await Status.create({
            authorId,
            content : content || '',
            mediaUrl,
        });

        res.status(201).json(status);
    } catch (error) {
        res.status(500).json({ message: 'Error creating status', error: error.message });
    }
};

// ── getStatuses ───────────────────────────────────────────────────────────────
exports.getStatuses = async (req, res) => {
    try {
        const { userId } = req.params;

        // Lightweight profile fetch — following array only.
        // If the profile is missing (user registered before the `user_registered`
        // event from auth-service was wired up, or the event got lost), don't
        // 404 — that silently empties the StoriesBar and the user can't see
        // the stories they just posted. Treat following as empty and proceed
        // so the user always sees at least their own active stories.
        const profile = await UserProfile
            .findOne({ userId }, { following: 1 })
            .lean();

        const following = profile?.following || [];

        const statuses = await Status.find({
            $or: [
                { authorId: { $in: following } },
                { authorId: userId }
            ],
            expiresAt: { $gt: new Date() }
        })
            .sort({ createdAt: -1 })
            .lean();

        res.json(statuses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching statuses', error: error.message });
    }
};

// ── deleteStatus ──────────────────────────────────────────────────────────────
exports.deleteStatus = async (req, res) => {
    try {
        const { statusId } = req.params;
        const userId       = req.user.userId;                      // [AUTH-1]

        const status = await Status.findById(statusId);
        if (!status) return res.status(404).json({ message: 'Status not found' });

        // Allow status author or admin to delete
        if (status.authorId.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized to delete this status' });
        }

        await Status.findByIdAndDelete(statusId);
        res.json({ message: 'Status deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting status', error: error.message });
    }
};