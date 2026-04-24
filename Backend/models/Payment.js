const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    buyerId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    listingId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Listing',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    razorpayOrderId: {
        type: String,
        required: true
    },
    razorpayPaymentId: {
        type: String
    },
    status: {
        type: String,
        enum: ['Created', 'Success', 'Failed'],
        default: 'Created'
    }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
