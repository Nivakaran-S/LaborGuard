const mongoose = require('mongoose');

/**
 * LegalOfficerRegistry
 *
 * This model acts as a local registry within the complaint-service
 * to store legal officer specializations and track assignment load.
 *
 * Since user profiles live in auth-service, we maintain this
 * lightweight registry here to power the round robin assignment
 * without cross-service calls on every complaint approval.
 *
 * Admins register legal officers here via the API before they
 * can be auto-assigned to appointments.
 */
const legalOfficerRegistrySchema = new mongoose.Schema(
  {
    // References the User._id from auth-service
    officerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Officer ID is required'],
      unique: true,
      ref: 'User'
    },

    name: {
      type: String,
      required: [true, 'Officer name is required'],
      trim: true
    },

    email: {
      type: String,
      required: [true, 'Officer email is required'],
      trim: true,
      lowercase: true
    },

    // Which case types this officer specializes in
    specializations: {
      type: [String],
      enum: ['labor_law', 'harassment_law', 'discrimination_law'],
      required: [true, 'At least one specialization is required'],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'Officer must have at least one specialization'
      }
    },

    isActive: {
      type: Boolean,
      default: true
    },

    // Total appointments ever assigned — used for round robin tiebreaking
    totalAssigned: {
      type: Number,
      default: 0
    },

    // Currently active (non-completed, non-cancelled) appointments
    activeAppointmentCount: {
      type: Number,
      default: 0
    },

    // Timestamp of last assignment — used for round robin tiebreaking
    lastAssignedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Index for fast specialization-based queries
legalOfficerRegistrySchema.index({ specializations: 1 });
legalOfficerRegistrySchema.index({ isActive: 1 });
legalOfficerRegistrySchema.index({ activeAppointmentCount: 1 });

module.exports = mongoose.model('LegalOfficerRegistry', legalOfficerRegistrySchema);