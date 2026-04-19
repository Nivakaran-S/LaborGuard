const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },

    type: { 
        type: String,
        enum: ['TEXT', 'IMAGE', 'STICKER'],
        default: 'TEXT'
    },

    content: { type: String },   // for text
    mediaUrl: { type: String },  // for images
    read: { type: Boolean, default: false }

}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);