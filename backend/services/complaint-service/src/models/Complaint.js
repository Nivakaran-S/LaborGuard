const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['image', 'document', 'video'],
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  changedByRole: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    default: null
  },
  changedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
      minlength: [10, 'Title must be at least 10 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    description: {
      type: String,
      required: [true, 'Complaint description is required'],
      trim: true,
      minlength: [30, 'Description must be at least 30 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'wage_theft',
        'unsafe_conditions',
        'wrongful_termination',
        'harassment',
        'discrimination',
        'unpaid_overtime',
        'other'
      ]
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'resolved', 'rejected'],
      default: 'pending'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    // The worker who filed the complaint
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Worker ID is required'],
      ref: 'User'
    },
    // The legal officer assigned to handle it
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    organizationName: {
      type: String,
      trim: true,
      maxlength: [200, 'Organization name cannot exceed 200 characters'],
      default: null
    },
    location: {
      city: {
        type: String,
        trim: true
      },
      district: {
        type: String,
        trim: true
      },
      country: {
        type: String,
        trim: true,
        default: 'Sri Lanka'
      }
    },
    attachments: {
      type: [attachmentSchema],
      default: []
    },
    // Full audit trail of every status change
    statusHistory: {
      type: [statusHistorySchema],
      default: []
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    isAnonymous: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true 
  }
);

// Index for fast queries by worker and status
complaintSchema.index({ workerId: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);