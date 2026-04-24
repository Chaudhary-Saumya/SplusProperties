const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
    listingId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Listing',
        required: true
    },
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['Inquiry', 'SiteVisit'],
        default: 'Inquiry'
    },
    message: {
        type: String
    },
    status: {
        type: String,
        enum: ['Pending', 'Contacted', 'Resolved'],
        default: 'Pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Inquiry', inquirySchema);
