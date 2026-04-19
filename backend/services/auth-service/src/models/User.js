const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'Please provide your first name'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Please provide your last name'],
        trim: true
    },
    birthDate: {
        type: Date,
        required: [true, 'Please provide your birth date']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email'
        ]
    },
    phone: {
        type: String,
        required: [true, 'Please provide your phone number'],
        unique: true,
        match: [
            /^07[0-9]{8}$/,
            'Please provide a valid 10-digit Sri Lankan phone number (07XXXXXXXX)'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false // Do not return password by default
    },
    role: {
        type: String,
        enum: ['worker', 'lawyer', 'ngo', 'employer', 'admin'],
        default: 'worker'
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isPhoneVerified: {
        type: Boolean,
        default: false
    },
    profile: {
        occupation: String,
        location: String,
        preferredLanguage: {
            type: String,
            enum: ['en', 'si', 'ta'],
            default: 'en'
        }
    },
    documents: [{
        type: String
    }],
    isApproved: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: Date
}, {
    timestamps: true
});

// Indexes are automatically created for unique fields (email, phone)
// userSchema.index({ email: 1 });
// userSchema.index({ phone: 1 });

module.exports = mongoose.model('User', userSchema);
