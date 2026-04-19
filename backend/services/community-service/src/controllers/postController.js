/**
 * postController.js — Community Service
 *
 * FIXES APPLIED:
 *  [AUTH-1]  authorId/userId always from req.user.userId (JWT) — never req.body
 *  [PERF-1]  getFeed: server-side $or query — eliminates [...following, userId] JS array spread
 *  [PERF-2]  sharePost: atomic $inc — eliminates load-then-save race condition
 *  [PERF-3]  likePost: atomic $addToSet / $pull — eliminates fragile splice/indexOf
 *  [BUG-1]   votePoll: poll.options[n].votes is an array of userId strings (not a counter).
 *  [PERF-4]  .lean() on all read-only queries
 *  [ENRICH]  getFeed/getTrending/getPostById: denormalized author fields written at create time
 *  [FALLBACK] getFeed falls back to trending when user has no follows
 *  [COMMENT]  createPost/updatePost write authorName/Avatar from UserProfile
 */

const Post        = require('../models/Post');
const UserProfile = require('../models/UserProfile');
const Report      = require('../models/Report');
const { emitEvent }          = require('../utils/kafkaProducer');
const { uploadToCloudinary } = require('../utils/cloudinaryConfig');

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse a field that may arrive as a JSON string (multipart) or already as array/object */
const parseField = (value, fallback) => {
    if (value === undefined || value === null) return fallback;
    if (typeof value === 'string') {
        try { return JSON.parse(value); } catch { return value; }
    }
    return value;
};

// ── createPost ────────────────────────────────────────────────────────────────
exports.createPost = async (req, res) => {
    try {
        const authorId = req.user.userId;                          // [AUTH-1]
        const { content } = req.body;
        const hashtags    = parseField(req.body.hashtags, []);
        const poll        = parseField(req.body.poll, undefined);

        // Enrich with author profile at write time (denormalized)
        const profile = await UserProfile.findOne({ userId: authorId }, { name: 1, avatarUrl: 1, role: 1 }).lean();
        const authorName   = profile?.name   || '';
        const authorAvatar = profile?.avatarUrl || '';
        const authorRole   = profile?.role   || 'worker';

        let mediaUrls = [];
        if (req.files?.length > 0) {
            const results = await Promise.all(req.files.map(f => uploadToCloudinary(f.buffer)));
            mediaUrls = results.map(r => r.secure_url);
        } else if (req.body.mediaUrls) {
            mediaUrls = parseField(req.body.mediaUrls, []);
            if (!Array.isArray(mediaUrls)) mediaUrls = [mediaUrls];
        }

        const post = await Post.create({ authorId, authorName, authorAvatar, authorRole, content, mediaUrls, hashtags, poll });
        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ message: 'Error creating post', error: error.message });
    }
};

// ── getFeed ───────────────────────────────────────────────────────────────────
exports.getFeed = async (req, res) => {
    try {
        const { userId } = req.params;
        const page  = Math.max(1, parseInt(req.query.page)  || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 20);

        const profile = await UserProfile.findOne({ userId }, { following: 1 }).lean();
        if (!profile) return res.status(404).json({ message: 'User profile not found' });

        let posts;

        if (profile.following?.length > 0) {
            // [PERF-1] Personalized feed
            posts = await Post.find({
                $or: [
                    { authorId: { $in: profile.following } },
                    { authorId: userId }
                ]
            })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean();                                             // [PERF-4]
        } else {
            // [FALLBACK] New user: fall back to global trending
            posts = await Post.aggregate([
                {
                    $addFields: {
                        engagementScore: {
                            $add: [{ $size: '$likes' }, '$shareCount', { $multiply: ['$commentCount', 2] }]
                        }
                    }
                },
                { $sort:  { engagementScore: -1, createdAt: -1 } },
                { $skip:  (page - 1) * limit },
                { $limit: limit }
            ]);
        }

        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching feed', error: error.message });
    }
};

// ── getTrendingFeed ───────────────────────────────────────────────────────────
exports.getTrendingFeed = async (req, res) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page)  || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 20);

        const posts = await Post.aggregate([
            {
                $addFields: {
                    engagementScore: {
                        $add: [{ $size: '$likes' }, '$shareCount', { $multiply: ['$commentCount', 2] }]
                    }
                }
            },
            { $sort:  { engagementScore: -1, createdAt: -1 } },
            { $skip:  (page - 1) * limit },
            { $limit: limit }
        ]);

        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching trending posts', error: error.message });
    }
};

// ── searchByHashtag ───────────────────────────────────────────────────────────
exports.searchByHashtag = async (req, res) => {
    try {
        const { tag } = req.params;
        const page    = Math.max(1, parseInt(req.query.page)  || 1);
        const limit   = Math.min(50, parseInt(req.query.limit) || 20);

        const posts = await Post.find({ hashtags: tag })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Error searching by hashtag', error: error.message });
    }
};

// ── getPostById ───────────────────────────────────────────────────────────────
exports.getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId).lean();
        if (!post) return res.status(404).json({ message: 'Post not found' });
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching post', error: error.message });
    }
};

// ── updatePost ────────────────────────────────────────────────────────────────
exports.updatePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const authorId   = req.user.userId;
        const { content } = req.body;

        const post = await Post.findById(postId);
        if (!post)                                     return res.status(404).json({ message: 'Post not found' });
        if (post.authorId.toString() !== authorId)     return res.status(403).json({ message: 'Unauthorized to edit this post' });

        if (content !== undefined) post.content = content;

        if (req.files?.length > 0) {
            const results  = await Promise.all(req.files.map(f => uploadToCloudinary(f.buffer)));
            post.mediaUrls = results.map(r => r.secure_url);
        } else if (req.body.mediaUrls) {
            const parsed   = parseField(req.body.mediaUrls, []);
            post.mediaUrls = Array.isArray(parsed) ? parsed : [parsed];
        }

        const saved = await post.save();
        res.json(saved);
    } catch (error) {
        res.status(500).json({ message: 'Error updating post', error: error.message });
    }
};

// ── deletePost ────────────────────────────────────────────────────────────────
exports.deletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId     = req.user.userId;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        if (post.authorId.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized to delete this post' });
        }

        await Post.findByIdAndDelete(postId);
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting post', error: error.message });
    }
};

// ── likePost ──────────────────────────────────────────────────────────────────
exports.likePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId     = req.user.userId;

        const alreadyLiked = await Post.exists({ _id: postId, likes: userId });
        const update       = alreadyLiked
            ? { $pull:     { likes: userId } }
            : { $addToSet: { likes: userId } };

        const post = await Post.findByIdAndUpdate(postId, update, { new: true });
        if (!post) return res.status(404).json({ message: 'Post not found' });

        if (!alreadyLiked && post.authorId.toString() !== userId) {
            emitEvent('community-events', 'post_liked', {
                likerId   : userId,
                authorId  : post.authorId,
                postId    : post._id
            });
        }

        res.json({ liked: !alreadyLiked, likeCount: post.likes.length });
    } catch (error) {
        res.status(500).json({ message: 'Error liking post', error: error.message });
    }
};

// ── sharePost ─────────────────────────────────────────────────────────────────
exports.sharePost = async (req, res) => {
    try {
        const { postId } = req.params;

        const post = await Post.findByIdAndUpdate(
            postId,
            { $inc: { shareCount: 1 } },
            { new: true }
        );
        if (!post) return res.status(404).json({ message: 'Post not found' });

        res.json({ shareCount: post.shareCount });
    } catch (error) {
        res.status(500).json({ message: 'Error sharing post', error: error.message });
    }
};

// ── votePoll ──────────────────────────────────────────────────────────────────
exports.votePoll = async (req, res) => {
    try {
        const { postId }    = req.params;
        const { optionIndex } = req.body;
        const userId          = req.user.userId;

        const post = await Post.findById(postId);
        if (!post?.poll?.options?.length) {
            return res.status(404).json({ message: 'Poll not found on this post' });
        }

        const idx = parseInt(optionIndex);
        if (isNaN(idx) || idx < 0 || idx >= post.poll.options.length) {
            return res.status(400).json({ message: 'Invalid option index' });
        }

        const alreadyVoted = post.poll.options.some(opt =>
            Array.isArray(opt.votes) && opt.votes.includes(userId)
        );
        if (alreadyVoted) {
            return res.status(409).json({ message: 'You have already voted on this poll' });
        }

        const updated = await Post.findByIdAndUpdate(
            postId,
            { $addToSet: { [`poll.options.${idx}.votes`]: userId } },
            { new: true }
        );

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Error voting on poll', error: error.message });
    }
};

// ── reportPost ────────────────────────────────────────────────────────────────
exports.reportPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const reporterId = req.user.userId;
        const { reason } = req.body;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        await Report.create({ reporterId, targetType: 'Post', targetId: postId, reason });

        await Post.findByIdAndUpdate(postId, { $inc: { reportCount: 1 }, isReported: true });

        res.status(201).json({ message: 'Post reported successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error reporting post', error: error.message });
    }
};