const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true
    },
    deviceInfo: {
        browser: String,
        os: String,
        device: String
    },
    ipAddress: String,
    lastActive: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for quick cleanup and lookup
sessionSchema.index({ userId: 1 });
sessionSchema.index({ token: 1 });

module.exports = mongoose.model('Session', sessionSchema);
