const mongoose = require('mongoose');

const rescheduleHistorySchema = new mongoose.Schema({
  previousDate: {
    type: Date,
    required: true
  },
  newDate: {
    type: Date,
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

const appointmentSchema = new mongoose.Schema(
  {
    // Reference to the complaint that triggered this appointment
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Complaint ID is required'],
      ref: 'Complaint'
    },

    // The worker who filed the complaint
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Worker ID is required'],
      ref: 'User'
    },

    // The legal officer assigned via round robin + specialization
    legalOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Legal officer ID is required'],
      ref: 'User'
    },

    // Complaint category that triggered the booking
    category: {
      type: String,
      required: true,
      enum: [
        'wage_theft',
        'wrongful_termination',
        'harassment',
        'discrimination'
      ]
    },

    // Specialization matched for this appointment
    specialization: {
      type: String,
      required: true,
      enum: ['labor_law', 'harassment_law', 'discrimination_law']
    },

    status: {
      type: String,
      enum: ['auto_booked', 'confirmed', 'completed', 'cancelled'],
      default: 'auto_booked'
    },

    // Scheduled date and time of the appointment
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled date is required']
    },

    // Duration in minutes
    duration: {
      type: Number,
      default: 60
    },

    // Meeting type
    meetingType: {
      type: String,
      enum: ['in_person', 'online', 'phone'],
      default: 'online'
    },

    // Online meeting link or physical location
    meetingDetails: {
      type: String,
      default: null
    },

    // Notes added by admin or legal officer
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: null
    },

    // Full audit trail of reschedules
    rescheduleHistory: {
      type: [rescheduleHistorySchema],
      default: []
    },

    confirmedAt: {
      type: Date,
      default: null
    },

    cancelledAt: {
      type: Date,
      default: null
    },

    cancellationReason: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast queries
appointmentSchema.index({ workerId: 1 });
appointmentSchema.index({ legalOfficerId: 1 });
appointmentSchema.index({ complaintId: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ scheduledAt: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);