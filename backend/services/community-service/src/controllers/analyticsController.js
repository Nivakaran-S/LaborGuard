const Post = require('../models/Post');
const Report = require('../models/Report');
const UserProfile = require('../models/UserProfile');
const Campaign = require('../models/Campaign');

// ── getCommunityAnalytics (admin only) ────────────────────────────────────────
exports.getCommunityAnalytics = async (req, res) => {
    try {
        const now = new Date();
        const dayMs = 24 * 60 * 60 * 1000;
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const weekAgo = new Date(now.getTime() - 7 * dayMs);
        const monthAgo = new Date(now.getTime() - 30 * dayMs);
        const fourteenAgo = new Date(now.getTime() - 14 * dayMs);

        const [
            postsToday,
            postsThisWeek,
            postsThisMonth,
            activeAuthors7d,
            topHashtagsAgg,
            reportsOpen,
            campaignsActive,
            campaignsSupporters,
            daily14dAgg,
            totalUsers,
        ] = await Promise.all([
            Post.countDocuments({ createdAt: { $gte: startOfToday } }),
            Post.countDocuments({ createdAt: { $gte: weekAgo } }),
            Post.countDocuments({ createdAt: { $gte: monthAgo } }),
            Post.distinct('authorId', { createdAt: { $gte: weekAgo } }),
            Post.aggregate([
                { $match: { createdAt: { $gte: monthAgo } } },
                { $unwind: '$hashtags' },
                { $group: { _id: '$hashtags', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]),
            Report.countDocuments({ status: 'Pending' }),
            Campaign.countDocuments({ status: 'active' }),
            Campaign.aggregate([
                { $match: { status: 'active' } },
                { $group: { _id: null, total: { $sum: '$supportersCount' } } },
            ]),
            Post.aggregate([
                { $match: { createdAt: { $gte: fourteenAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        posts: { $sum: 1 },
                        likes: { $sum: { $size: { $ifNull: ['$likes', []] } } },
                        comments: { $sum: { $ifNull: ['$commentCount', 0] } },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            UserProfile.countDocuments(),
        ]);

        res.json({
            postsToday,
            postsThisWeek,
            postsThisMonth,
            activeUsers7d: activeAuthors7d.length,
            totalUsers,
            topHashtags: topHashtagsAgg.map((h) => ({ tag: h._id, count: h.count })),
            reportsOpen,
            campaignsActive,
            campaignsSupportersTotal: campaignsSupporters[0]?.total || 0,
            daily14d: daily14dAgg.map((d) => ({
                date: d._id,
                posts: d.posts,
                likes: d.likes,
                comments: d.comments,
            })),
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching community analytics', error: error.message });
    }
};
