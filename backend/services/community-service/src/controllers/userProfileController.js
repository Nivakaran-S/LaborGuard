/**
 * userProfileController.js — Community Service
 *
 * FIXES APPLIED:
 *  [AUTH-1]  currentUserId / userId always from req.user.userId (JWT) — never req.body
 *  [PERF-1]  followUser  : parallel atomic $addToSet — eliminates load-save race condition
 *  [PERF-2]  unfollowUser: parallel atomic $pull     — eliminates fragile filter() mutation
 *  [PERF-3]  getBookmarks: real DB-level pagination via separate Post query
 *            (was: Mongoose populate with in-memory skip/limit — not actual DB pagination)
 *  [PERF-4]  toggleBookmark: atomic $addToSet / $pull — replaces splice/indexOf
 *  [PERF-5]  .lean() on all read-only queries
 */

const UserProfile = require('../models/UserProfile');
const Post        = require('../models/Post');
const Report      = require('../models/Report');
const { emitEvent } = require('../utils/kafkaProducer');

// ── getProfile ────────────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        const profile = await UserProfile.findOne({ userId }).lean(); // [PERF-5]
        if (!profile) return res.status(404).json({ message: 'Profile not found' });

        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
};

// ── createOrUpdateProfile ─────────────────────────────────────────────────────
exports.createOrUpdateProfile = async (req, res) => {
  try {
    // FIX: was const { userId, name, role, avatarUrl, bio } = req.body
    // Reading userId from req.body lets any authenticated user overwrite any other
    // user's profile by simply sending a different userId in the request body.
    // Now userId always comes from the verified JWT — users can only edit their own profile.
    const userId = req.user.userId;                              // FIX: from JWT
    const { name, role, avatarUrl, bio } = req.body;

    const update = {};
    if (name      !== undefined) update.name      = name;
    if (role      !== undefined) update.role      = role;
    if (avatarUrl !== undefined) update.avatarUrl = avatarUrl;
    if (bio       !== undefined) update.bio       = bio;

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      { $set: update, $setOnInsert: { userId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

// ── followUser ────────────────────────────────────────────────────────────────
exports.followUser = async (req, res) => {
  try {
    const currentUserId = req.user.userId;   // from JWT
    const { targetUserId } = req.body;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const [currentUser, targetUser] = await Promise.all([
      UserProfile.exists({ userId: currentUserId }),
      UserProfile.exists({ userId: targetUserId }),
    ]);
    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    await Promise.all([
      UserProfile.updateOne({ userId: currentUserId }, { $addToSet: { following: targetUserId } }),
      UserProfile.updateOne({ userId: targetUserId  }, { $addToSet: { followers: currentUserId } }),
    ]);

    emitEvent('community-events', 'user_followed', {
      followerId   : currentUserId,
      targetUserId : targetUserId,
    });

    res.json({ message: 'Successfully followed user' });
  } catch (error) {
    res.status(500).json({ message: 'Error following user', error: error.message });
  }
};

// ── unfollowUser ──────────────────────────────────────────────────────────────
exports.unfollowUser = async (req, res) => {
    try {
        const currentUserId = req.user.userId;                     // [AUTH-1]
        const { targetUserId } = req.body;

        if (!targetUserId) {
            return res.status(400).json({ message: 'targetUserId is required' });
        }

        // [PERF-2] Parallel atomic $pull — replaces fragile filter() on Mongoose array
        await Promise.all([
            UserProfile.updateOne(
                { userId: currentUserId },
                { $pull: { following: targetUserId } }
            ),
            UserProfile.updateOne(
                { userId: targetUserId },
                { $pull: { followers: currentUserId } }
            ),
        ]);

        res.json({ message: 'Successfully unfollowed user' });
    } catch (error) {
        res.status(500).json({ message: 'Error unfollowing user', error: error.message });
    }
};

// ── toggleBookmark ────────────────────────────────────────────────────────────
exports.toggleBookmark = async (req, res) => {
  try {
    const currentUserId = req.user.userId;   // from JWT
    const { postId } = req.body;

    if (!postId) return res.status(400).json({ message: 'postId is required' });

    const hasBookmark = await UserProfile.exists({ userId: currentUserId, bookmarks: postId });
    const update = hasBookmark
      ? { $pull:     { bookmarks: postId } }
      : { $addToSet: { bookmarks: postId } };

    const profile = await UserProfile.findOneAndUpdate(
      { userId: currentUserId },
      update,
      { new: true }
    );

    res.json({
      message : hasBookmark ? 'Bookmark removed' : 'Bookmark added',
      profile,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling bookmark', error: error.message });
  }
};

// ── getBookmarks ──────────────────────────────────────────────────────────────
exports.getBookmarks = async (req, res) => {
  try {
    const { userId } = req.params;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);

    const profile = await UserProfile.findOne({ userId }, { bookmarks: 1 }).lean();
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    // Real DB-level pagination on the Post collection
    const posts = await Post.find({ _id: { $in: profile.bookmarks } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookmarks', error: error.message });
  }
};

// ── reportProfile ─────────────────────────────────────────────────────────────
exports.reportProfile = async (req, res) => {
    try {
        const { userId: targetUserId } = req.params;
        const reporterId = req.user.userId;                        // [AUTH-1]
        const { reason } = req.body;

        const targetProfile = await UserProfile.findOne({ userId: targetUserId });
        if (!targetProfile) return res.status(404).json({ message: 'Profile not found' });

        await Report.create({
            reporterId,
            targetType : 'UserProfile',
            targetId   : targetUserId,
            reason
        });

        res.status(201).json({ message: 'Profile reported successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error reporting profile', error: error.message });
    }
};