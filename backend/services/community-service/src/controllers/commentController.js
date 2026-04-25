/**
 * commentController.js — Community Service
 *
 * FIXES APPLIED:
 *  [AUTH-1]  authorId / reporterId always from req.user.userId (JWT) — never req.body
 *  [PERF-1]  .lean() on read queries
 *  [ROBUST]  Admin override for delete (matches postController pattern)
 */

const Comment = require('../models/Comment');
const Post    = require('../models/Post');
const Report  = require('../models/Report');
const UserProfile = require('../models/UserProfile');
const { emitEvent } = require('../utils/kafkaProducer');
const mongoose = require('mongoose');

// ── addComment ────────────────────────────────────────────────────────────────
exports.addComment = async (req, res) => {
    try {
        const { postId }  = req.params;
        const authorId    = req.user.userId;
        const { content, parentCommentId } = req.body;

        if (!content?.trim()) {
            return res.status(400).json({ message: 'Comment content is required' });
        }

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        // Validate parent comment: must belong to same post, must NOT be a reply itself (depth cap 1)
        let parent = null;
        if (parentCommentId) {
            parent = await Comment.findById(parentCommentId);
            if (!parent) return res.status(404).json({ message: 'Parent comment not found' });
            if (parent.postId.toString() !== postId) {
                return res.status(400).json({ message: 'Parent comment belongs to a different post' });
            }
            if (parent.parentCommentId) {
                return res.status(400).json({ message: 'Replies cannot themselves be replied to' });
            }
        }

        // Denormalize author
        const profile = await UserProfile.findOne(
            { userId: authorId },
            { name: 1, avatarUrl: 1 }
        ).lean();

        const comment = await Comment.create({
            postId,
            authorId,
            authorName: profile?.name || '',
            authorAvatar: profile?.avatarUrl || '',
            content: content.trim(),
            parentCommentId: parentCommentId || null,
        });

        await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

        // Notify post author (don't notify on self-comments)
        if (post.authorId.toString() !== authorId) {
            emitEvent('community-events', 'post_commented', {
                commenterId : authorId,
                authorId    : post.authorId,
                postId      : post._id,
                commentId   : comment._id
            });
        }
        // Notify parent comment author too (if different from post author and commenter)
        if (parent && parent.authorId !== authorId && parent.authorId !== post.authorId.toString()) {
            emitEvent('community-events', 'post_commented', {
                commenterId : authorId,
                authorId    : parent.authorId,
                postId      : post._id,
                commentId   : comment._id,
                replyTo     : parent._id
            });
        }

        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ message: 'Error adding comment', error: error.message });
    }
};

// ── getComments ───────────────────────────────────────────────────────────────
// Returns a 2-level tree. Top-level comments paginated; all replies for those
// top-level are included in a `replies` array on each.
exports.getComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const page  = Math.max(1, parseInt(req.query.page)  || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 20);

        const topLevel = await Comment.find({ postId, parentCommentId: null })
            .sort({ createdAt: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        if (topLevel.length === 0) return res.json([]);

        const parentIds = topLevel.map((c) => c._id);
        const replies = await Comment.find({
            postId,
            parentCommentId: { $in: parentIds },
        })
            .sort({ createdAt: 1 })
            .lean();

        const byParent = {};
        for (const r of replies) {
            const key = r.parentCommentId.toString();
            (byParent[key] = byParent[key] || []).push(r);
        }

        const tree = topLevel.map((c) => ({
            ...c,
            replies: byParent[c._id.toString()] || [],
        }));

        res.json(tree);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching comments', error: error.message });
    }
};

// ── updateComment ─────────────────────────────────────────────────────────────
exports.updateComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId        = req.user.userId;
        const { content }   = req.body;

        if (!content?.trim()) {
            return res.status(400).json({ message: 'Comment content is required' });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        if (comment.authorId.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized to edit this comment' });
        }

        comment.content = content;
        comment.isEdited = true;
        comment.editedAt = new Date();
        await comment.save();

        res.json(comment);
    } catch (error) {
        res.status(500).json({ message: 'Error updating comment', error: error.message });
    }
};

// ── deleteComment ─────────────────────────────────────────────────────────────
exports.deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId        = req.user.userId;

        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        if (comment.authorId.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized to delete this comment' });
        }

        // Cascade delete direct replies (depth is capped at 1, so this is the
        // full descendant set).
        const childCount = comment.parentCommentId
            ? 0
            : await Comment.countDocuments({ parentCommentId: commentId });

        const decrementBy = 1 + childCount;

        await Promise.all([
            Comment.findByIdAndDelete(commentId),
            Comment.deleteMany({ parentCommentId: commentId }),
            Post.findByIdAndUpdate(comment.postId, { $inc: { commentCount: -decrementBy } })
        ]);

        res.json({ message: 'Comment deleted successfully', cascadedReplies: childCount });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting comment', error: error.message });
    }
};

// ── reportComment ─────────────────────────────────────────────────────────────
exports.reportComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const reporterId    = req.user.userId;                     // [AUTH-1]
        const { reason }    = req.body;

        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        await Report.create({ reporterId, targetType: 'Comment', targetId: commentId, reason });

        // Increment reportCount atomically
        await Comment.findByIdAndUpdate(commentId, {
            $inc:  { reportCount: 1 },
            isReported: true
        });

        res.status(201).json({ message: 'Comment reported successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error reporting comment', error: error.message });
    }
};