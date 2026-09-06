const mongoose = require('mongoose');

const rewardTransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: [
            'WELCOME_INSTALL',
            'WELCOME_LOGIN',
            'DAILY_CHECKIN',
            'FEATURE_USAGE',
            'REFERRAL_BONUS',
            'WITHDRAWAL_LOCK',
            'WITHDRAWAL_REFUND',
            'WITHDRAWAL_SUCCESS',
            'ADMIN_ADJUSTMENT'
        ],
        required: true
    },
    coins: {
        type: Number,
        required: true // Positive for credit, negative for debit
    },
    amountINR: {
        type: Number,
        required: true // Equivalent in INR (coins / 20)
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['COMPLETED', 'PENDING', 'CANCELLED'],
        default: 'COMPLETED'
    },
    metadata: {
        taskId: String,
        referredUserId: { type: mongoose.Schema.ObjectId, ref: 'User' },
        withdrawalId: { type: mongoose.Schema.ObjectId, ref: 'WithdrawalRequest' },
        deviceId: String
    }
}, { timestamps: true });

rewardTransactionSchema.index({ userId: 1, createdAt: -1 });
rewardTransactionSchema.index({ userId: 1, type: 1 });
rewardTransactionSchema.index({ userId: 1, 'metadata.taskId': 1 });

module.exports = mongoose.model('RewardTransaction', rewardTransactionSchema);
