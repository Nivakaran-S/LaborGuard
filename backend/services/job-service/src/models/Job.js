const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    employerId: {
        type: mongoose.Schema.Types.ObjectId, // Will ref User from auth-service
        required: [true, 'Employer ID is required']
    },
    title: {
        type: String,
        required: [true, 'Job title is required'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Job description is required'],
        maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    wage: {
        amount: {
            type: Number,
            required: [true, 'Wage amount is required'],
            min: [0, 'Wage must be a positive number']
        },
        currency: {
            type: String,
            default: 'USD', // Adjust to local currency if needed
        },
        frequency: {
            type: String,
            enum: ['hourly', 'daily', 'weekly', 'monthly', 'yearly', 'per_task'],
            required: [true, 'Wage payment frequency is required']
        }
    },
    compliesWithMinimumWage: {
        type: Boolean,
        default: false,
        required: true
    },
    location: {
        address: { type: String },
        city: { type: String, required: [true, 'City is required'] },
        state: { type: String },
        country: { type: String, default: 'Sri Lanka' }, // Updated default to Sri Lanka
    },
    jobType: {
        type: String,
        enum: ['full_time', 'part_time', 'contract', 'temporary', 'freelance', 'daily_wage'],
        required: [true, 'Job type is required']
    },
    status: {
        type: String,
        enum: ['open', 'closed', 'filled', 'pending_review'],
        default: 'open'
    },
    imageUrl: {
        type: String,
        default: 'https://images.unsplash.com/photo-1541913057-25e11409ee10?q=80&w=2070&auto=format&fit=crop' // Industrial placeholder
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Optionally, you could add pre-save hooks to automatically check wage against a minimum wage registry if you build that later.

module.exports = mongoose.model('Job', JobSchema);
