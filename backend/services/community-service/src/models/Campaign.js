const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
    title: { type: String, required: true, minlength: 10, maxlength: 150 },
    description: { type: String, required: true, minlength: 50, maxlength: 5000 },
    cta: { type: String, default: '', maxlength: 300 },
    imageUrl: { type: String, default: '' },
    targetGoal: { type: Number, default: 0 },

    category: {
        type: String,
        enum: ['labor_rights', 'safety', 'wages', 'legislation', 'awareness'],
        default: 'labor_rights',
        index: true,
    },

    // Creator (denormalized for cheap list rendering)
    createdBy: { type: String, required: true, index: true },
    creatorName: { type: String, default: '' },
    creatorRole: { type: String, default: 'ngo' },
    creatorAvatar: { type: String, default: '' },

    supporters: [{ type: String }],
    supportersCount: { type: Number, default: 0, index: true },

    status: {
        type: String,
        enum: ['draft', 'active', 'completed', 'archived'],
        default: 'active',
        index: true,
    },

    relatedPostIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
}, { timestamps: true });

campaignSchema.index({ createdAt: -1 });
campaignSchema.index({ supportersCount: -1 });
campaignSchema.index({ status: 1, category: 1 });
campaignSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Campaign', campaignSchema);
