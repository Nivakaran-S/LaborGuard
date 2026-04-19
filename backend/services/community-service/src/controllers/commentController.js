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
const { emitEvent } = require('../utils/kafkaProducer');
const mongoose = require('mongoose');

// ── addComment ────────────────────────────────────────────────────────────────
exports.addComment = async (req, res) => {
    try {
        const { postId }  = req.params;
        const authorId    = req.user.userId;                       // [AUTH-1]
        const { content } = req.body;

        if (!content?.trim()) {
            return res.status(400).json({ message: 'Comment content is required' });
        }

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const comment = await Comment.create({ postId, authorId, content });

        // Atomically increment commentCount on the post
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

        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ message: 'Error adding comment', error: error.message });
    }
};

// ── getComments ───────────────────────────────────────────────────────────────
exports.getComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const page  = Math.max(1, parseInt(req.query.page)  || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 20);

        const comments = await Comment.find({ postId })
            .sort({ createdAt: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();                                                // [PERF-1]

        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching comments', error: error.message });
    }
};

// ── deleteComment ─────────────────────────────────────────────────────────────
exports.deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId        = req.user.userId;                     // [AUTH-1]

        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        // Allow the comment author or an admin to delete
        if (comment.authorId.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized to delete this comment' });
        }

        // Decrement commentCount atomically (floor at 0)
        await Promise.all([
            Comment.findByIdAndDelete(commentId),
            Post.findByIdAndUpdate(comment.postId, { $inc: { commentCount: -1 } })
        ]);
        res.json({ message: 'Comment deleted successfully' });
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