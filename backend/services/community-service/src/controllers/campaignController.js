/**
 * campaignController.js
 * Advocacy campaigns — created by NGO/admin, supported by any user, updated via Post.
 */

const Campaign = require('../models/Campaign');
const Post = require('../models/Post');
const UserProfile = require('../models/UserProfile');
const { emitEvent } = require('../utils/kafkaProducer');
const { uploadToCloudinary } = require('../utils/cloudinaryConfig');
const { COMMUNITY_EVENTS, TOPICS } = require('../utils/eventTypes');

// ── createCampaign ────────────────────────────────────────────────────────────
exports.createCampaign = async (req, res) => {
    try {
        const createdBy = req.user.userId;
        const { title, description, cta, targetGoal, category } = req.body;

        const profile = await UserProfile.findOne(
            { userId: createdBy },
            { name: 1, avatarUrl: 1, role: 1 }
        ).lean();

        let imageUrl = '';
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);
            imageUrl = result.secure_url;
        } else if (req.body.imageUrl) {
            imageUrl = req.body.imageUrl;
        }

        const campaign = await Campaign.create({
            title,
            description,
            cta: cta || '',
            imageUrl,
            targetGoal: Number(targetGoal) || 0,
            category: category || 'labor_rights',
            createdBy,
            creatorName: profile?.name || '',
            creatorRole: profile?.role || 'ngo',
            creatorAvatar: profile?.avatarUrl || '',
        });

        emitEvent(TOPICS.COMMUNITY, COMMUNITY_EVENTS.CAMPAIGN_CREATED, {
            campaignId: campaign._id,
            creatorId: createdBy,
            title: campaign.title,
            category: campaign.category,
        });

        res.status(201).json(campaign);
    } catch (error) {
        res.status(500).json({ message: 'Error creating campaign', error: error.message });
    }
};

// ── getCampaigns ──────────────────────────────────────────────────────────────
exports.getCampaigns = async (req, res) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page)  || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 20);
        const { status, category, sort = 'trending' } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (category) filter.category = category;
        // Default: show active campaigns only
        if (!status) filter.status = 'active';

        const sortOrder = sort === 'recent'
            ? { createdAt: -1 }
            : { supportersCount: -1, createdAt: -1 };

        const campaigns = await Campaign.find(filter)
            .sort(sortOrder)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        res.json(campaigns);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching campaigns', error: error.message });
    }
};

// ── getCampaignById ───────────────────────────────────────────────────────────
exports.getCampaignById = async (req, res) => {
    try {
        const { id } = req.params;
        const callerId = req.user.userId;

        const campaign = await Campaign.findById(id).lean();
        if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

        const hasSupported = campaign.supporters?.includes(callerId) || false;

        res.json({ ...campaign, hasSupported });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching campaign', error: error.message });
    }
};

// ── updateCampaign ────────────────────────────────────────────────────────────
exports.updateCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const role = req.user.role;

        const campaign = await Campaign.findById(id);
        if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
        if (campaign.createdBy !== userId && role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized to edit this campaign' });
        }

        const { title, description, cta, imageUrl, status, targetGoal, category } = req.body;
        if (title !== undefined) campaign.title = title;
        if (description !== undefined) campaign.description = description;
        if (cta !== undefined) campaign.cta = cta;
        if (imageUrl !== undefined) campaign.imageUrl = imageUrl;
        if (status !== undefined) campaign.status = status;
        if (targetGoal !== undefined) campaign.targetGoal = Number(targetGoal);
        if (category !== undefined) campaign.category = category;

        await campaign.save();
        res.json(campaign);
    } catch (error) {
        res.status(500).json({ message: 'Error updating campaign', error: error.message });
    }
};

// ── deleteCampaign (soft) ─────────────────────────────────────────────────────
exports.deleteCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const role = req.user.role;

        const campaign = await Campaign.findById(id);
        if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
        if (campaign.createdBy !== userId && role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized to delete this campaign' });
        }

        campaign.status = 'archived';
        await campaign.save();
        res.json({ message: 'Campaign archived' });
    } catch (error) {
        res.status(500).json({ message: 'Error archiving campaign', error: error.message });
    }
};

// ── supportCampaign ───────────────────────────────────────────────────────────
exports.supportCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const already = await Campaign.exists({ _id: id, supporters: userId });
        if (already) return res.status(409).json({ message: 'Already supporting this campaign' });

        const campaign = await Campaign.findByIdAndUpdate(
            id,
            { $addToSet: { supporters: userId }, $inc: { supportersCount: 1 } },
            { new: true }
        );
        if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

        if (campaign.createdBy !== userId) {
            emitEvent(TOPICS.COMMUNITY, COMMUNITY_EVENTS.CAMPAIGN_SUPPORTED, {
                campaignId: campaign._id,
                supporterId: userId,
                creatorId: campaign.createdBy,
                title: campaign.title,
            });
        }

        res.json({ supportersCount: campaign.supportersCount, hasSupported: true });
    } catch (error) {
        res.status(500).json({ message: 'Error supporting campaign', error: error.message });
    }
};

// ── unsupportCampaign ─────────────────────────────────────────────────────────
exports.unsupportCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const had = await Campaign.exists({ _id: id, supporters: userId });
        if (!had) return res.status(409).json({ message: 'Not supporting this campaign' });

        const campaign = await Campaign.findByIdAndUpdate(
            id,
            { $pull: { supporters: userId }, $inc: { supportersCount: -1 } },
            { new: true }
        );
        if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

        res.json({ supportersCount: campaign.supportersCount, hasSupported: false });
    } catch (error) {
        res.status(500).json({ message: 'Error removing support', error: error.message });
    }
};

// ── getCampaignSupporters ─────────────────────────────────────────────────────
exports.getCampaignSupporters = async (req, res) => {
    try {
        const { id } = req.params;

        const campaign = await Campaign.findById(id, { supporters: 1 }).lean();
        if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

        if (!campaign.supporters?.length) return res.json([]);

        const profiles = await UserProfile.find(
            { userId: { $in: campaign.supporters } },
            { userId: 1, name: 1, avatarUrl: 1, role: 1, isVerified: 1 }
        )
            .limit(100)
            .lean();

        res.json(profiles);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching supporters', error: error.message });
    }
};

// ── addCampaignUpdate ─────────────────────────────────────────────────────────
// Creates a Post linked to the campaign and fans out notifications to supporters.
exports.addCampaignUpdate = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const role = req.user.role;
        const { content } = req.body;

        if (!content?.trim()) {
            return res.status(400).json({ message: 'Update content is required' });
        }

        const campaign = await Campaign.findById(id);
        if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
        if (campaign.createdBy !== userId && role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized to post campaign updates' });
        }

        // Author enrichment
        const profile = await UserProfile.findOne(
            { userId },
            { name: 1, avatarUrl: 1, role: 1 }
        ).lean();

        let mediaUrls = [];
        if (req.files?.length > 0) {
            const results = await Promise.all(req.files.map((f) => uploadToCloudinary(f.buffer)));
            mediaUrls = results.map((r) => r.secure_url);
        }

        const post = await Post.create({
            authorId: userId,
            authorName: profile?.name || campaign.creatorName,
            authorAvatar: profile?.avatarUrl || campaign.creatorAvatar,
            authorRole: profile?.role || 'ngo',
            content: content.trim(),
            mediaUrls,
            hashtags: [campaign.category],
            campaignId: campaign._id,
        });

        await Campaign.findByIdAndUpdate(id, {
            $addToSet: { relatedPostIds: post._id },
        });

        emitEvent(TOPICS.COMMUNITY, COMMUNITY_EVENTS.CAMPAIGN_UPDATE_POSTED, {
            campaignId: campaign._id,
            postId: post._id,
            supporters: campaign.supporters || [],
            title: campaign.title,
        });

        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ message: 'Error posting campaign update', error: error.message });
    }
};

// ── getCampaignUpdates ────────────────────────────────────────────────────────
exports.getCampaignUpdates = async (req, res) => {
    try {
        const { id } = req.params;
        const page  = Math.max(1, parseInt(req.query.page)  || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 20);

        const posts = await Post.find({ campaignId: id })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching campaign updates', error: error.message });
    }
};
