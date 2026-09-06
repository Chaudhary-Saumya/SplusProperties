const Listing = require('../models/Listing');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Inquiry = require('../models/Inquiry');
const PageHit = require('../models/PageHit');
const Setting = require('../models/Setting');
const asyncHandler = require('../middlewares/async');

// @desc    Get Dashboard Analytics
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
exports.getDashboardStats = asyncHandler(async (req, res, next) => {
    const totalUsers = await User.countDocuments();
    const usersBreakdown = await User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);

    const totalListings = await Listing.countDocuments();
    const verifiedListings = await Listing.countDocuments({ listingType: 'Verified' });
    
    const recentListings = await Listing.find().sort('-createdAt').limit(10).populate('createdBy', 'name email role profileImage');
    
    // Revenue from tokens
    const payments = await Payment.find({ status: 'Success' });
    const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);

    const totalInquiries = await Inquiry.countDocuments();
    
    // Detailed users with listing counts
    const usersWithListings = await User.aggregate([
        {
            $lookup: {
                from: 'listings',
                localField: '_id',
                foreignField: 'createdBy',
                as: 'userListings'
            }
        },
        {
            $project: {
                name: 1,
                email: 1,
                role: 1,
                phone: 1,
                profileImage: 1,
                accountStatus: 1,
                googleId: 1,
                coinsBalance: 1,
                referralCode: 1,
                isVerified: 1,
                identityVerified: 1,
                documentVerified: 1,
                createdAt: 1,
                hasPassword: {
                    $cond: {
                        if: {
                            $and: [
                                { $ne: ["$password", null] },
                                { $ne: ["$password", ""] }
                            ]
                        },
                        then: true,
                        else: false
                    }
                },
                authProvider: {
                    $cond: {
                        if: {
                            $and: [
                                { $ne: ["$googleId", null] },
                                { $ne: ["$googleId", ""] }
                            ]
                        },
                        then: {
                            $cond: {
                                if: {
                                    $and: [
                                        { $ne: ["$password", null] },
                                        { $ne: ["$password", ""] }
                                    ]
                                },
                                then: "Both",
                                else: "Google"
                            }
                        },
                        else: "Manual"
                    }
                },
                listingCount: { $size: "$userListings" }
            }
        },
        { $sort: { createdAt: -1 } }
    ]);

    // Page Hits
    const pageHits = await PageHit.find().sort({ date: -1, hits: -1 });


    
    // All listings for property management
    const allListings = await Listing.find().sort('-createdAt').populate('createdBy', 'name email role profileImage');

    res.status(200).json({
        success: true,
        data: {
            metrics: {
                totalUsers,
                totalListings,
                verifiedListings,
                totalRevenue,
                totalInquiries,
            },
            usersBreakdown,
            users: usersWithListings,
            recentListings,

            allListings,
            pageHits
        }
    });
});

// Default System Settings Configuration
const DEFAULT_SETTINGS = [
    // Feature Toggles (Pages & Systems On/Off)
    { key: 'enableRewardsSystem', value: true, description: 'Master On/Off switch for Coin Rewards, Referrals & Wallet' },
    { key: 'enableAreaConverter', value: true, description: 'Enable/Disable Land Area Converter Tool' },
    { key: 'enableBoundaryMap', value: true, description: 'Enable/Disable Land Measure (GPS Boundary Map) Tool' },
    { key: 'enableLoanCalculator', value: true, description: 'Enable/Disable Land EMI & Loan Calculator' },
    { key: 'enableBrokersDirectory', value: true, description: 'Enable/Disable Verified Brokers Directory' },
    { key: 'enablePostProperty', value: true, description: 'Enable/Disable User Property Posting' },

    // Economy & Coin Rules
    { key: 'minWithdrawalINR', value: 50, description: 'Minimum Cashout Balance threshold in INR (₹)' },
    { key: 'coinToINRRate', value: 20, description: 'How many Coins equal ₹1.00 (e.g. 20 Coins = ₹1.00)' },
    { key: 'welcomeLoginCoins', value: 100, description: 'Coins awarded on User Registration & Login' },
    { key: 'referralBonusCoins', value: 200, description: 'Coins awarded per successful referral invite' },
    { key: 'firstPropertyCoins', value: 500, description: 'Coins awarded when a user posts their 1st land plot listing' },
    { key: 'directDailyCapINR', value: 30, description: 'Maximum direct daily tasks earning limit in INR (₹)' },
    { key: 'dailyCheckinCoins', value: 20, description: 'Coins awarded for Daily Check-in Streak' },
    { key: 'landMapCoins', value: 20, description: 'Coins awarded for using GPS Boundary Map tool' },
    { key: 'areaConverterCoins', value: 20, description: 'Coins awarded for using Area Converter' },
    { key: 'viewListingsCoins', value: 20, description: 'Coins awarded for exploring land properties' }
];

// @desc    Get all system settings (with auto-defaults)
// @route   GET /api/admin/settings
// @access  Private (Admin)
exports.getSystemSettings = asyncHandler(async (req, res, next) => {
    let settings = await Setting.find();
    
    // Auto-seed missing defaults
    const existingKeys = new Set(settings.map(s => s.key));
    const missingSettings = DEFAULT_SETTINGS.filter(d => !existingKeys.has(d.key));

    if (missingSettings.length > 0) {
        await Setting.insertMany(missingSettings);
        settings = await Setting.find();
    }

    res.status(200).json({
        success: true,
        data: settings
    });
});

// @desc    Update multiple system settings in batch
// @route   POST /api/admin/settings/batch
// @access  Private (Admin)
exports.saveBatchSettings = asyncHandler(async (req, res, next) => {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ success: false, error: 'Please provide settings object' });
    }

    const updates = [];
    for (const [key, value] of Object.entries(settings)) {
        updates.push(
            Setting.findOneAndUpdate(
                { key },
                { key, value },
                { upsert: true, new: true }
            )
        );
    }

    await Promise.all(updates);
    const updatedSettings = await Setting.find();

    res.status(200).json({
        success: true,
        message: 'System settings updated successfully!',
        data: updatedSettings
    });
});

// @desc    Update a system setting
// @route   PATCH /api/admin/settings/:key
// @access  Private (Admin)
exports.updateSystemSetting = asyncHandler(async (req, res, next) => {
    let setting = await Setting.findOne({ key: req.params.key });

    if (!setting) {
        setting = await Setting.create({
            key: req.params.key,
            value: req.body.value,
            description: req.body.description || ''
        });
    } else {
        setting.value = req.body.value;
        if (req.body.description) setting.description = req.body.description;
        await setting.save();
    }

    res.status(200).json({
        success: true,
        data: setting
    });
});

// @desc    Get all withdrawal requests with user earning history for audit
// @route   GET /api/admin/withdrawals
// @access  Private (Admin)
exports.getAdminWithdrawals = asyncHandler(async (req, res, next) => {
    const WithdrawalRequest = require('../models/WithdrawalRequest');
    const RewardTransaction = require('../models/RewardTransaction');
    const { status } = req.query;
    const query = {};
    if (status && status !== 'ALL') {
        query.status = status;
    }

    const withdrawals = await WithdrawalRequest.find(query)
        .populate('userId', 'name email phone referralCode coinsBalance totalCoinsEarned createdAt')
        .sort('-createdAt');

    // For each withdrawal, attach the full transaction history of that user for admin audit
    const enriched = await Promise.all(withdrawals.map(async (w) => {
        const wd = w.toObject();
        if (wd.userId && wd.userId._id) {
            const history = await RewardTransaction.find({ userId: wd.userId._id })
                .sort({ createdAt: -1 })
                .limit(50)
                .select('type coins amountINR description createdAt metadata');
            wd.userEarningHistory = history;
        }
        return wd;
    }));

    res.status(200).json({
        success: true,
        count: enriched.length,
        data: enriched
    });
});

// @desc    Approve/Mark Paid a withdrawal request — Atomically deducts coins from user wallet
// @route   PUT /api/admin/withdrawals/:id/approve
// @access  Private (Admin)
exports.approveAdminWithdrawal = asyncHandler(async (req, res, next) => {
    const WithdrawalRequest = require('../models/WithdrawalRequest');
    const RewardTransaction = require('../models/RewardTransaction');

    const withdrawal = await WithdrawalRequest.findById(req.params.id).populate('userId');
    if (!withdrawal) {
        return res.status(404).json({ success: false, error: 'Withdrawal request not found' });
    }

    if (withdrawal.status !== 'PENDING') {
        return res.status(400).json({ success: false, error: `Withdrawal is already ${withdrawal.status.toLowerCase()}` });
    }

    const targetUser = withdrawal.userId; // populated
    if (!targetUser) {
        return res.status(404).json({ success: false, error: 'User for this withdrawal request not found' });
    }

    // ATOMIC: Deduct coins only now (bank-grade — only if user still has sufficient balance)
    const coinsToDeduct = withdrawal.coinsOnHold || withdrawal.coins;
    const updatedUser = await User.findOneAndUpdate(
        {
            _id: targetUser._id,
            coinsBalance: { $gte: coinsToDeduct }
        },
        {
            $inc: { coinsBalance: -coinsToDeduct }
        },
        { new: true }
    );

    if (!updatedUser) {
        // User doesn't have enough coins — could be fraud; reject instead
        withdrawal.status = 'REJECTED';
        withdrawal.adminNote = 'Automatically rejected: User balance insufficient at time of payout';
        withdrawal.processedAt = new Date();
        withdrawal.processedBy = req.user.id;
        await withdrawal.save();
        return res.status(400).json({
            success: false,
            error: 'User wallet balance is insufficient. Request automatically rejected and coins were not deducted.'
        });
    }

    const utrRef = req.body.transactionRef || `UTR-${Date.now()}`;
    withdrawal.status = 'PAID';
    withdrawal.transactionRef = utrRef;
    withdrawal.adminNote = req.body.adminNote || 'Payout completed and transferred successfully';
    withdrawal.processedAt = new Date();
    withdrawal.processedBy = req.user.id;
    await withdrawal.save();

    // Ledger: record the actual deduction
    await RewardTransaction.create({
        userId: targetUser._id,
        type: 'WITHDRAWAL_SUCCESS',
        coins: -coinsToDeduct,
        amountINR: -withdrawal.amountINR,
        description: `✅ Payout Completed: ₹${withdrawal.amountINR.toFixed(2)} transferred via ${withdrawal.paymentType} (Ref: ${utrRef}) — ${coinsToDeduct} Coins deducted`,
        metadata: { withdrawalId: withdrawal._id, utrRef }
    });

    res.status(200).json({
        success: true,
        message: `✅ Withdrawal of ₹${withdrawal.amountINR.toFixed(2)} approved. Coins deducted from user wallet.`,
        data: withdrawal
    });
});

// @desc    Reject and cancel a withdrawal request (no coins were deducted on submit)
// @route   PUT /api/admin/withdrawals/:id/reject
// @access  Private (Admin)
exports.rejectAdminWithdrawal = asyncHandler(async (req, res, next) => {
    const WithdrawalRequest = require('../models/WithdrawalRequest');
    const RewardTransaction = require('../models/RewardTransaction');

    const withdrawal = await WithdrawalRequest.findById(req.params.id);
    if (!withdrawal) {
        return res.status(404).json({ success: false, error: 'Withdrawal request not found' });
    }

    if (withdrawal.status !== 'PENDING') {
        return res.status(400).json({ success: false, error: `Withdrawal is already ${withdrawal.status.toLowerCase()}` });
    }

    withdrawal.status = 'REJECTED';
    withdrawal.adminNote = req.body.adminNote || 'Payment details incorrect or failed verification';
    withdrawal.processedAt = new Date();
    withdrawal.processedBy = req.user.id;
    await withdrawal.save();

    // Since coins were NEVER deducted on submit, no refund needed.
    // Just create a ledger entry for audit purposes.
    await RewardTransaction.create({
        userId: withdrawal.userId,
        type: 'WITHDRAWAL_REFUND',
        coins: 0,
        amountINR: 0,
        description: `❌ Cashout request rejected — ₹${withdrawal.amountINR.toFixed(2)} (${withdrawal.coins} Coins) — Reason: ${withdrawal.adminNote}`,
        metadata: { withdrawalId: withdrawal._id }
    });

    res.status(200).json({
        success: true,
        message: 'Withdrawal request rejected. User coins were not affected (no deduction had occurred).',
        data: withdrawal
    });
});

// @desc    Verify Admin Master PIN
// @route   POST /api/admin/verify-pin
// @access  Private (Admin)
exports.verifyAdminPin = asyncHandler(async (req, res, next) => {
    const crypto = require('crypto');
    const { pin } = req.body;
    
    if (!pin) {
        return res.status(400).json({ success: false, error: 'Please enter your Master PIN' });
    }

    const cleanPin = String(pin).trim();
    const envPin = process.env.ADMIN_SECURITY_PIN;
    const pinSetting = await Setting.findOne({ key: 'admin_master_pin_hash' });
    let isValid = false;

    if (pinSetting && pinSetting.value) {
        const hashedAttempt = crypto.createHash('sha256').update(cleanPin).digest('hex');
        isValid = (hashedAttempt === pinSetting.value) || (envPin && cleanPin === envPin);
    } else if (envPin) {
        isValid = (cleanPin === envPin);
    }

    if (!isValid) {
        return res.status(403).json({ success: false, error: 'ACCESS DENIED: Invalid Master Admin Security PIN' });
    }

    res.status(200).json({
        success: true,
        message: 'Master Security PIN verified successfully!'
    });
});

// @desc    Change Admin Master PIN
// @route   POST /api/admin/change-pin
// @access  Private (Admin)
exports.changeAdminPin = asyncHandler(async (req, res, next) => {
    const crypto = require('crypto');
    const { currentPin, newPin } = req.body;

    if (!currentPin || !newPin) {
        return res.status(400).json({ success: false, error: 'Current PIN and New PIN are required' });
    }

    const cleanCurrent = String(currentPin).trim();
    const cleanNew = String(newPin).trim();
    const envPin = process.env.ADMIN_SECURITY_PIN;

    if (cleanNew.length < 4 || cleanNew.length > 8) {
        return res.status(400).json({ success: false, error: 'New PIN must be 4 to 8 digits' });
    }

    // Verify current PIN
    const pinSetting = await Setting.findOne({ key: 'admin_master_pin_hash' });
    let isCurrentValid = false;

    if (pinSetting && pinSetting.value) {
        const hashedAttempt = crypto.createHash('sha256').update(cleanCurrent).digest('hex');
        isCurrentValid = (hashedAttempt === pinSetting.value) || (envPin && cleanCurrent === envPin);
    } else if (envPin) {
        isCurrentValid = (cleanCurrent === envPin);
    }

    if (!isCurrentValid) {
        return res.status(403).json({ success: false, error: 'Current Master PIN is incorrect' });
    }

    const newHash = crypto.createHash('sha256').update(cleanNew).digest('hex');
    await Setting.findOneAndUpdate(
        { key: 'admin_master_pin_hash' },
        { key: 'admin_master_pin_hash', value: newHash, description: 'Hashed Master Admin Security PIN' },
        { upsert: true, new: true }
    );

    res.status(200).json({
        success: true,
        message: 'Master Admin PIN updated and encrypted successfully!'
    });
});

// @desc    Broadcast Push Notification to Mobile App / Web Users
// @route   POST /api/admin/broadcast-push
// @access  Private (Admin)
exports.broadcastPushNotification = asyncHandler(async (req, res) => {
    const { title, body, route = '/search', imageUrl = null, targetRole = 'ALL' } = req.body;
    const { broadcastAll } = require('../services/pushNotificationService');

    if (!title || !body) {
        return res.status(400).json({ success: false, message: 'Title and Body are required for push notification.' });
    }

    const result = await broadcastAll({
        title: title.trim(),
        body: body.trim(),
        data: {
            route: route || '/search',
            type: 'ADMIN_BROADCAST',
            sentAt: new Date().toISOString()
        },
        imageUrl: imageUrl ? imageUrl.trim() : null,
        targetRole
    });

    res.status(200).json({
        success: true,
        message: `Notification broadcast dispatched to ${result.successCount} devices!`,
        result
    });
});

// @desc    Get Device Push Stats for Admin Dashboard
// @route   GET /api/admin/push-stats
// @access  Private (Admin)
exports.getPushStats = asyncHandler(async (req, res) => {
    const { getRegisteredDeviceStats } = require('../services/pushNotificationService');
    const stats = await getRegisteredDeviceStats();
    res.status(200).json({
        success: true,
        data: stats
    });
});

