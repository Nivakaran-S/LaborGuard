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
const FollowRequest = require('../models/FollowRequest');
const { emitEvent } = require('../utils/kafkaProducer');
const { COMMUNITY_EVENTS, TOPICS } = require('../utils/eventTypes');

const ALLOWED_HIDDEN_FIELDS = ['bio', 'followers', 'following'];

// Centralize privacy logic so getProfile / getPostsByAuthor stay consistent.
const canViewProfile = (callerId, profile) => {
    if (!profile?.isPrivate) return true;
    if (callerId === profile.userId) return true;
    return profile.followers?.includes(callerId);
};

// Scrub hidden fields from a profile for non-owner, non-follower viewers.
const applyHiddenFields = (callerId, profile) => {
    if (!profile) return profile;
    const copy = { ...profile };
    const isSelf = callerId === copy.userId;
    const isFollower = copy.followers?.includes(callerId);
    if (isSelf || isFollower) return copy;
    for (const f of copy.hiddenFields || []) {
        if (ALLOWED_HIDDEN_FIELDS.includes(f)) {
            if (f === 'bio') copy.bio = '';
            if (f === 'followers') copy.followers = [];
            if (f === 'following') copy.following = [];
        }
    }
    return copy;
};

// ── getProfile ────────────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const callerId = req.user.userId;

        const profile = await UserProfile.findOne({ userId }).lean();
        if (!profile) return res.status(404).json({ message: 'Profile not found' });

        // Private profiles: strangers see only public shell; hiddenFields further scrubs
        if (!canViewProfile(callerId, profile)) {
            return res.json({
                userId: profile.userId,
                name: profile.name,
                avatarUrl: profile.avatarUrl,
                role: profile.role,
                isVerified: profile.isVerified,
                isPrivate: true,
            });
        }

        res.json(applyHiddenFields(callerId, profile));
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
    const { name, role, avatarUrl, bio, isPrivate, hiddenFields } = req.body;

    const update = {};
    if (name         !== undefined) update.name         = name;
    if (role         !== undefined) update.role         = role;
    if (avatarUrl    !== undefined) update.avatarUrl    = avatarUrl;
    if (bio          !== undefined) update.bio          = bio;
    if (isPrivate    !== undefined) update.isPrivate    = Boolean(isPrivate);
    if (Array.isArray(hiddenFields)) {
        update.hiddenFields = hiddenFields.filter((f) => ALLOWED_HIDDEN_FIELDS.includes(f));
    }

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
    const currentUserId = req.user.userId;
    const { targetUserId } = req.body;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const [currentUser, targetUser] = await Promise.all([
      UserProfile.findOne({ userId: currentUserId }, { name: 1, avatarUrl: 1, role: 1 }).lean(),
      UserProfile.findOne({ userId: targetUserId }, { isPrivate: 1 }).lean(),
    ]);
    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    // Private target → create a follow request instead of immediate follow
    if (targetUser.isPrivate) {
      try {
        const fr = await FollowRequest.create({
          requesterId: currentUserId,
          targetUserId,
          requesterName: currentUser.name || '',
          requesterAvatar: currentUser.avatarUrl || '',
          requesterRole: currentUser.role || 'worker',
        });

        emitEvent(TOPICS.COMMUNITY, COMMUNITY_EVENTS.FOLLOW_REQUESTED, {
          requesterId: currentUserId,
          targetUserId,
          requestId: fr._id,
        });

        return res.json({ message: 'Follow request sent', status: 'pending' });
      } catch (err) {
        // Duplicate pending request
        if (err.code === 11000) {
          return res.json({ message: 'Follow request already pending', status: 'pending' });
        }
        throw err;
      }
    }

    await Promise.all([
      UserProfile.updateOne({ userId: currentUserId }, { $addToSet: { following: targetUserId } }),
      UserProfile.updateOne({ userId: targetUserId  }, { $addToSet: { followers: currentUserId } }),
    ]);

    emitEvent(TOPICS.COMMUNITY, COMMUNITY_EVENTS.USER_FOLLOWED, {
      followerId: currentUserId,
      targetUserId,
    });

    res.json({ message: 'Successfully followed user', status: 'following' });
  } catch (error) {
    res.status(500).json({ message: 'Error following user', error: error.message });
  }
};

// ── getIncomingFollowRequests ────────────────────────────────────────────────
exports.getIncomingFollowRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const requests = await FollowRequest.find({ targetUserId: userId, status: 'pending' })
      .sort({ createdAt: -1 })
      .lean();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching follow requests', error: error.message });
  }
};

// ── approveFollowRequest ─────────────────────────────────────────────────────
exports.approveFollowRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const request = await FollowRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.targetUserId !== userId) {
      return res.status(403).json({ message: 'Cannot approve a request not addressed to you' });
    }
    if (request.status !== 'pending') {
      return res.status(409).json({ message: `Request already ${request.status}` });
    }

    request.status = 'approved';
    await Promise.all([
      request.save(),
      UserProfile.updateOne({ userId: request.requesterId }, { $addToSet: { following: userId } }),
      UserProfile.updateOne({ userId }, { $addToSet: { followers: request.requesterId } }),
    ]);

    emitEvent(TOPICS.COMMUNITY, COMMUNITY_EVENTS.FOLLOW_REQUEST_APPROVED, {
      requesterId: request.requesterId,
      targetUserId: userId,
    });

    res.json({ message: 'Follow request approved' });
  } catch (error) {
    res.status(500).json({ message: 'Error approving follow request', error: error.message });
  }
};

// ── rejectFollowRequest ──────────────────────────────────────────────────────
exports.rejectFollowRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const request = await FollowRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.targetUserId !== userId) {
      return res.status(403).json({ message: 'Cannot reject a request not addressed to you' });
    }

    request.status = 'rejected';
    await request.save();

    res.json({ message: 'Follow request rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting follow request', error: error.message });
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

// ── getProfileStats ───────────────────────────────────────────────────────────
exports.getProfileStats = async (req, res) => {
    try {
        const { userId } = req.params;

        const profile = await UserProfile.findOne(
            { userId },
            { followers: 1, following: 1, isPrivate: 1 }
        ).lean();
        if (!profile) return res.status(404).json({ message: 'Profile not found' });

        const [agg] = await Post.aggregate([
            { $match: { authorId: userId } },
            {
                $group: {
                    _id: null,
                    postCount: { $sum: 1 },
                    totalLikes: { $sum: { $size: { $ifNull: ['$likes', []] } } },
                    totalComments: { $sum: { $ifNull: ['$commentCount', 0] } },
                }
            }
        ]);

        res.json({
            postCount: agg?.postCount || 0,
            totalLikes: agg?.totalLikes || 0,
            totalComments: agg?.totalComments || 0,
            followers: profile.followers?.length || 0,
            following: profile.following?.length || 0,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile stats', error: error.message });
    }
};

// ── searchProfiles ────────────────────────────────────────────────────────────
exports.searchProfiles = async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        const { role } = req.query;

        if (q.length < 2) {
            return res.status(400).json({ message: 'Query must be at least 2 characters' });
        }

        // Escape regex special chars to avoid ReDoS / malformed regex
        const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const filter = { name: new RegExp(escaped, 'i') };
        if (role) filter.role = role;

        const profiles = await UserProfile.find(
            filter,
            { userId: 1, name: 1, avatarUrl: 1, role: 1, isVerified: 1, bio: 1 }
        )
            .limit(20)
            .lean();

        res.json(profiles);
    } catch (error) {
        res.status(500).json({ message: 'Error searching profiles', error: error.message });
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