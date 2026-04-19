const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    workerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    workerName: {
        type: String,
        required: true
    },
    workerEmail: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    workerExperience: {
        type: String,
        required: [true, 'Please provide your work experience']
    },
    additionalDetails: {
        type: String,
        default: ''
    },
    appliedDate: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String,
        default: ''
    }
});

// Ensure a worker can't apply for the same job twice
ApplicationSchema.index({ jobId: 1, workerId: 1 }, { unique: true });

module.exports = mongoose.model('Application', ApplicationSchema);
