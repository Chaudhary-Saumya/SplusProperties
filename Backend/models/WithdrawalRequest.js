const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    coins: {
        type: Number,
        required: true,
        min: [0, 'Coins must be positive']
    },
    amountINR: {
        type: Number,
        required: true,
        min: [0, 'Amount must be positive']
    },
    paymentType: {
        type: String,
        enum: ['UPI', 'BANK'],
        required: true
    },
    upiId: {
        type: String,
        trim: true
    },
    bankDetails: {
        holderName: String,
        bankName: String,
        accountNumber: String,
        ifscCode: String
    },
    // Coins are kept in USER wallet during PENDING; only deducted after admin approves
    coinsOnHold: {
        type: Number,
        default: 0
    },
    // Snapshot of user's earning history at time of request (for admin audit)
    earningSummary: {
        totalCoinsEarned: { type: Number, default: 0 },
        welcomeCoins: { type: Number, default: 0 },
        dailyCheckinCoins: { type: Number, default: 0 },
        featureUsageCoins: { type: Number, default: 0 },
        referralCoins: { type: Number, default: 0 },
        transactionCount: { type: Number, default: 0 }
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'PAID'],
        default: 'PENDING',
        index: true
    },
    transactionRef: {
        type: String,
        trim: true
    },
    adminNote: {
        type: String,
        default: ''
    },
    processedAt: {
        type: Date
    },
    processedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

withdrawalRequestSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
