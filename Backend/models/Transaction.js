const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    buyerId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    sellerId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    listingId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Listing',
        required: true
    },
    payoutAccountId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    paymentGateway: {
        type: String,
        enum: ['Razorpay', 'Stripe'],
        required: true
    },
    gatewayOrderId: {
        type: String,
        required: true
    },
    gatewayPaymentId: {
        type: String
    },
    status: {
        type: String,
        enum: ['Pending', 'Captured', 'Failed', 'Refunded'],
        default: 'Pending'
    },
    receiptNumber: {
        type: String,
        unique: true
    },
    paymentDetails: {
        type: Object // Flexible field for gateway response
    }
}, {
    timestamps: true
});

// Auto-generate receipt number before save
transactionSchema.pre('save', function() {
    if (!this.receiptNumber) {
        this.receiptNumber = 'REC-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    }
});

module.exports = mongoose.model('Transaction', transactionSchema);
