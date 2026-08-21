const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    listingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    buyerName: {
        type: String,
        default: 'Interested Buyer'
    },
    buyerPhone: {
        type: String,
        default: 'N/A'
    },
    leadType: {
        type: String,
        enum: ['WhatsApp', 'Call'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

leadSchema.index({ sellerId: 1, createdAt: -1 });
leadSchema.index({ listingId: 1 });

module.exports = mongoose.model('Lead', leadSchema);
