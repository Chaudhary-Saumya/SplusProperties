const User = require('../models/User');
const RewardTransaction = require('../models/RewardTransaction');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const Setting = require('../models/Setting');
const asyncHandler = require('../middlewares/async');

// Dynamic Config Fetcher from Setting model with 60s in-memory cache
let cachedConfig = null;
let lastCacheTime = 0;
const CACHE_TTL = 60 * 1000;

const getRewardSystemConfig = async () => {
    const now = Date.now();
    if (cachedConfig && (now - lastCacheTime < CACHE_TTL)) {
        return cachedConfig;
    }
    try {
        const settings = await Setting.find().lean();
        const map = {};
        settings.forEach(s => { map[s.key] = s.value; });

        const isEnabled = map['enableRewardsSystem'] !== false; // default true
        const coinRate = Number(map['coinToINRRate']) || 20; // 20 coins = ₹1
        const minWithdrawalINR = Number(map['minWithdrawalINR']) || 50; // default ₹50 minimum withdrawal
        const minWithdrawalCoins = Math.round(minWithdrawalINR * coinRate); // e.g. 50 * 20 = 1000 coins
        const welcomeLoginCoins = Number(map['welcomeLoginCoins']) || 100;
        const referralBonusCoins = Number(map['referralBonusCoins']) || 200;
        const directDailyCapINR = Number(map['directDailyCapINR']) || 30;
        const directDailyCapCoins = Math.round(directDailyCapINR * coinRate);
        const dailyCheckinCoins = Number(map['dailyCheckinCoins']) || 20;
        const landMapCoins = Number(map['landMapCoins']) || 20;
        const areaConverterCoins = Number(map['areaConverterCoins']) || 20;
        const viewListingsCoins = Number(map['viewListingsCoins']) || 20;
        const firstPropertyCoins = Number(map['firstPropertyCoins']) || 500;

        cachedConfig = {
            isEnabled,
            coinRate,
            minWithdrawalINR,
            minWithdrawalCoins,
            welcomeLoginCoins,
            referralBonusCoins,
            directDailyCapINR,
            directDailyCapCoins,
            dailyCheckinCoins,
            landMapCoins,
            areaConverterCoins,
            viewListingsCoins,
            firstPropertyCoins
        };
        lastCacheTime = now;
        return cachedConfig;
    } catch (err) {
        return {
            isEnabled: true,
            coinRate: 20,
            minWithdrawalINR: 50,
            minWithdrawalCoins: 1000,
            welcomeLoginCoins: 100,
            referralBonusCoins: 200,
            directDailyCapINR: 30,
            directDailyCapCoins: 600,
            dailyCheckinCoins: 20,
            landMapCoins: 20,
            areaConverterCoins: 20,
            viewListingsCoins: 20,
            firstPropertyCoins: 500
        };
    }
};

// Helper: Get today's YYYY-MM-DD in IST
const getTodayDateString = () => {
    const d = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(d.getTime() + istOffset);
    return istDate.toISOString().split('T')[0];
};

// Helper: Get start of today in IST
const getStartOfToday = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    istNow.setUTCHours(0, 0, 0, 0);
    return new Date(istNow.getTime() - istOffset);
};

// @desc    Get user's coin wallet, task statuses, referral stats, and transaction history
// @route   GET /api/rewards/wallet
// @access  Private
exports.getWallet = asyncHandler(async (req, res) => {
    const todayStr = getTodayDateString();
    const startOfToday = getStartOfToday();

    // Fetch config and user concurrently
    const [cfg, user] = await Promise.all([
        getRewardSystemConfig(),
        User.findById(req.user.id).lean()
    ]);

    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Parallel execution of all wallet sub-queries
    const [
        loginBonusExists,
        directTransactions,
        referralCount,
        referralTransactions,
        todaysTransactions,
        firstPropertyExists,
        recentTransactions,
        pendingWithdrawal
    ] = await Promise.all([
        RewardTransaction.exists({ userId: user._id, type: { $in: ['WELCOME_LOGIN', 'WELCOME_INSTALL'] } }),
        RewardTransaction.find({ userId: user._id, type: { $in: ['WELCOME_INSTALL', 'WELCOME_LOGIN', 'DAILY_CHECKIN', 'FEATURE_USAGE'] } }).lean(),
        User.countDocuments({ referredBy: user._id }),
        RewardTransaction.find({ userId: user._id, type: 'REFERRAL_BONUS' }).lean(),
        RewardTransaction.find({ userId: user._id, createdAt: { $gte: startOfToday } }).lean(),
        RewardTransaction.exists({ userId: user._id, type: 'FIRST_PROPERTY_LISTING' }),
        RewardTransaction.find({ userId: user._id }).sort({ createdAt: -1 }).limit(20).lean(),
        WithdrawalRequest.findOne({ userId: user._id, status: 'PENDING' }).sort({ createdAt: -1 }).lean()
    ]);

    let coinsBalance = user.coinsBalance || 0;
    let totalCoinsEarned = user.totalCoinsEarned || 0;
    let referralCode = user.referralCode;

    // Auto-award Welcome Login Bonus or create referral code if missing
    if (!loginBonusExists || !referralCode) {
        const fullUser = await User.findById(user._id);
        if (fullUser) {
            let modified = false;
            if (!loginBonusExists) {
                fullUser.coinsBalance = (fullUser.coinsBalance || 0) + cfg.welcomeLoginCoins;
                fullUser.totalCoinsEarned = (fullUser.totalCoinsEarned || 0) + cfg.welcomeLoginCoins;
                coinsBalance = fullUser.coinsBalance;
                totalCoinsEarned = fullUser.totalCoinsEarned;
                if (!fullUser.referralCode) {
                    const randStr = Math.random().toString(36).substring(2, 8).toUpperCase();
                    fullUser.referralCode = `KP${randStr}`;
                }
                referralCode = fullUser.referralCode;
                modified = true;

                await RewardTransaction.create({
                    userId: user._id,
                    type: 'WELCOME_LOGIN',
                    coins: cfg.welcomeLoginCoins,
                    amountINR: parseFloat((cfg.welcomeLoginCoins / cfg.coinRate).toFixed(2)),
                    description: `Welcome Account Registration Bonus (₹${(cfg.welcomeLoginCoins / cfg.coinRate).toFixed(2)})`
                });
            } else if (!fullUser.referralCode) {
                const randStr = Math.random().toString(36).substring(2, 8).toUpperCase();
                fullUser.referralCode = `KP${randStr}`;
                referralCode = fullUser.referralCode;
                modified = true;
            }
            if (modified) {
                await fullUser.save();
            }
        }
    }

    // Calculate total coins earned from direct non-referral sources
    const txnDirectSum = directTransactions.reduce((acc, t) => acc + (t.coins > 0 ? t.coins : 0), 0);
    const completedTasksSum = (user.completedTasks || []).reduce((acc, t) => acc + (t.coins || 20), 0);
    const directCoinsEarned = Math.max(txnDirectSum, completedTasksSum, coinsBalance);

    // Referral stats
    const referralCoinsEarned = referralTransactions.reduce((acc, t) => acc + t.coins, 0);

    // Task completions
    const isCheckinDoneToday = (user.lastDailyCheckin && new Date(user.lastDailyCheckin) >= startOfToday) ||
        todaysTransactions.some(t => t.type === 'DAILY_CHECKIN' || t.metadata?.taskId === 'DAILY_CHECKIN') ||
        (user.completedTasks || []).some(t => t.taskId === 'DAILY_CHECKIN' && t.date === todayStr);

    const isLandMapDoneToday = todaysTransactions.some(t => t.metadata?.taskId === 'LAND_MAP_USED') ||
        (user.completedTasks || []).some(t => t.taskId === 'LAND_MAP_USED' && t.date === todayStr);

    const isAreaConverterDoneToday = todaysTransactions.some(t => t.metadata?.taskId === 'AREA_CONVERTER_USED') ||
        (user.completedTasks || []).some(t => t.taskId === 'AREA_CONVERTER_USED' && t.date === todayStr);

    const isViewListingsDoneToday = todaysTransactions.some(t => t.metadata?.taskId === 'VIEW_LISTINGS') ||
        (user.completedTasks || []).some(t => t.taskId === 'VIEW_LISTINGS' && t.date === todayStr);

    const isFirstPropertyDone = (user.completedTasks || []).some(t => t.taskId === 'FIRST_PROPERTY_LISTING') ||
        !!firstPropertyExists;

    res.status(200).json({
        success: true,
        data: {
            isEnabled: cfg.isEnabled,
            coinsBalance: coinsBalance,
            amountINR: parseFloat((coinsBalance / cfg.coinRate).toFixed(2)),
            totalCoinsEarned: totalCoinsEarned,
            totalINR: parseFloat((totalCoinsEarned / cfg.coinRate).toFixed(2)),
            directCoinsEarned,
            directCoinsCap: cfg.directDailyCapCoins,
            directCapINR: cfg.directDailyCapINR,
            isDirectCapReached: directCoinsEarned >= cfg.directDailyCapCoins,
            referralCode: referralCode,
            hasAppliedReferral: !!user.referredBy,
            referralCount,
            referralCoinsEarned,
            referralBonusPerFriend: cfg.referralBonusCoins,
            minWithdrawalCoins: cfg.minWithdrawalCoins,
            minWithdrawalINR: cfg.minWithdrawalINR,
            coinRate: cfg.coinRate,
            tasks: {
                welcomeLogin: {
                    id: 'WELCOME_LOGIN',
                    title: 'Welcome Login Bonus',
                    coins: cfg.welcomeLoginCoins,
                    amountINR: parseFloat((cfg.welcomeLoginCoins / cfg.coinRate).toFixed(2)),
                    completed: true,
                    claimed: true
                },
                firstProperty: {
                    id: 'FIRST_PROPERTY_LISTING',
                    title: 'Post First Land Listing',
                    coins: cfg.firstPropertyCoins,
                    amountINR: parseFloat((cfg.firstPropertyCoins / cfg.coinRate).toFixed(2)),
                    completed: !!isFirstPropertyDone,
                    claimed: !!isFirstPropertyDone
                },
                dailyCheckin: {
                    id: 'DAILY_CHECKIN',
                    title: 'Daily Check-in',
                    coins: cfg.dailyCheckinCoins,
                    amountINR: parseFloat((cfg.dailyCheckinCoins / cfg.coinRate).toFixed(2)),
                    completed: !!isCheckinDoneToday,
                    claimedToday: !!isCheckinDoneToday,
                    claimed: !!isCheckinDoneToday
                },
                landMap: {
                    id: 'LAND_MAP_USED',
                    title: 'Explore Land Measure Map',
                    coins: cfg.landMapCoins,
                    amountINR: parseFloat((cfg.landMapCoins / cfg.coinRate).toFixed(2)),
                    completed: !!isLandMapDoneToday,
                    claimed: !!isLandMapDoneToday
                },
                landMapUsed: {
                    id: 'LAND_MAP_USED',
                    title: 'Explore Land Measure Map',
                    coins: cfg.landMapCoins,
                    amountINR: parseFloat((cfg.landMapCoins / cfg.coinRate).toFixed(2)),
                    completed: !!isLandMapDoneToday,
                    claimed: !!isLandMapDoneToday
                },
                areaConverter: {
                    id: 'AREA_CONVERTER_USED',
                    title: 'Use Land Area Converter',
                    coins: cfg.areaConverterCoins,
                    amountINR: parseFloat((cfg.areaConverterCoins / cfg.coinRate).toFixed(2)),
                    completed: !!isAreaConverterDoneToday,
                    claimed: !!isAreaConverterDoneToday
                },
                areaConverterUsed: {
                    id: 'AREA_CONVERTER_USED',
                    title: 'Use Land Area Converter',
                    coins: cfg.areaConverterCoins,
                    amountINR: parseFloat((cfg.areaConverterCoins / cfg.coinRate).toFixed(2)),
                    completed: !!isAreaConverterDoneToday,
                    claimed: !!isAreaConverterDoneToday
                },
                viewListings: {
                    id: 'VIEW_LISTINGS',
                    title: 'Explore Verified Properties',
                    coins: cfg.viewListingsCoins,
                    amountINR: parseFloat((cfg.viewListingsCoins / cfg.coinRate).toFixed(2)),
                    completed: !!isViewListingsDoneToday,
                    claimed: !!isViewListingsDoneToday
                }
            },
            pendingWithdrawal,
            recentTransactions
        }
    });
});

// @desc    Claim 100 Coins (₹5.00) on App Install / First Open (Device Fingerprint protected)
// @route   POST /api/rewards/claim-install
// @access  Public (Optional auth)
exports.claimInstall = asyncHandler(async (req, res) => {
    const cfg = await getRewardSystemConfig();
    if (!cfg.isEnabled) {
        return res.status(400).json({ success: false, error: 'Rewards program is currently paused.' });
    }

    const { deviceId, referralCode } = req.body;
    if (!deviceId) {
        return res.status(400).json({ success: false, error: 'Device ID required' });
    }

    const deviceBonusAlreadyGiven = await RewardTransaction.findOne({
        type: 'WELCOME_INSTALL',
        'metadata.deviceId': deviceId
    });

    if (deviceBonusAlreadyGiven) {
        return res.status(200).json({
            success: true,
            alreadyAwarded: true,
            message: 'Device install bonus already credited previously'
        });
    }

    let userId = req.user ? req.user.id : null;
    let user = null;

    if (userId) {
        user = await User.findById(userId);
    }

    const amountINR = parseFloat((cfg.welcomeLoginCoins / cfg.coinRate).toFixed(2));

    await RewardTransaction.create({
        userId: userId || undefined,
        type: 'WELCOME_INSTALL',
        coins: cfg.welcomeLoginCoins,
        amountINR,
        description: `Welcome App Install Bonus (${cfg.welcomeLoginCoins} Coins / ₹${amountINR})`,
        metadata: { deviceId }
    });

    if (user) {
        user.coinsBalance = (user.coinsBalance || 0) + cfg.welcomeLoginCoins;
        user.totalCoinsEarned = (user.totalCoinsEarned || 0) + cfg.welcomeLoginCoins;
        if (!user.deviceTokensAwarded) user.deviceTokensAwarded = [];
        user.deviceTokensAwarded.push(deviceId);
        await user.save();
    }

    res.status(200).json({
        success: true,
        coinsAwarded: cfg.welcomeLoginCoins,
        amountINR,
        message: `🎉 +${cfg.welcomeLoginCoins} Coins (₹${amountINR}) credited for installing Kharsan Properties!`
    });
});

// @desc    Claim 100 Coins (₹5.00) on Login / Registration
// @route   POST /api/rewards/claim-login
// @access  Private
exports.claimLoginReward = asyncHandler(async (req, res) => {
    const cfg = await getRewardSystemConfig();
    if (!cfg.isEnabled) {
        return res.status(400).json({ success: false, error: 'Rewards program is currently paused.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    const existingLoginBonus = await RewardTransaction.findOne({
        userId: user._id,
        type: 'WELCOME_LOGIN'
    });

    if (existingLoginBonus) {
        return res.status(400).json({
            success: false,
            error: 'You have already claimed the Welcome Registration & Login reward.'
        });
    }

    const amountINR = parseFloat((cfg.welcomeLoginCoins / cfg.coinRate).toFixed(2));

    user.coinsBalance = (user.coinsBalance || 0) + cfg.welcomeLoginCoins;
    user.totalCoinsEarned = (user.totalCoinsEarned || 0) + cfg.welcomeLoginCoins;
    await user.save();

    await RewardTransaction.create({
        userId: user._id,
        type: 'WELCOME_LOGIN',
        coins: cfg.welcomeLoginCoins,
        amountINR,
        description: `Welcome Account Registration Bonus (₹${amountINR})`
    });

    res.status(200).json({
        success: true,
        coinsAwarded: cfg.welcomeLoginCoins,
        amountINR,
        newBalance: user.coinsBalance,
        message: `🎉 +${cfg.welcomeLoginCoins} Coins (₹${amountINR}) Welcome Bonus added to your wallet!`
    });
});

// @desc    Claim Daily Activity Tasks
// @route   POST /api/rewards/claim-task
// @access  Private
exports.claimTask = asyncHandler(async (req, res) => {
    const cfg = await getRewardSystemConfig();
    if (!cfg.isEnabled) {
        return res.status(400).json({ success: false, error: 'Rewards program is currently paused by admin.' });
    }

    const { taskId } = req.body;
    const allowedTasks = {
        'DAILY_CHECKIN': { coins: cfg.dailyCheckinCoins, desc: 'Daily Check-in Streak (+₹1.00)' },
        'LAND_MAP_USED': { coins: cfg.landMapCoins, desc: 'Land Measure (Map) GPS Tool Usage (+₹1.00)' },
        'AREA_CONVERTER_USED': { coins: cfg.areaConverterCoins, desc: 'Area Converter Usage (+₹1.00)' },
        'VIEW_LISTINGS': { coins: cfg.viewListingsCoins, desc: 'Explore Land Listings (+₹1.00)' }
    };

    if (!taskId || !allowedTasks[taskId]) {
        return res.status(400).json({ success: false, error: 'Invalid task ID specified' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    const todayStr = getTodayDateString();
    const startOfToday = getStartOfToday();

    // Check if task already completed today
    const taskAlreadyCompletedInUser = (user.completedTasks || []).some(
        t => t.taskId === taskId && t.date === todayStr
    );

    const taskAlreadyInDb = await RewardTransaction.findOne({
        userId: user._id,
        createdAt: { $gte: startOfToday },
        $or: [
            { 'metadata.taskId': taskId },
            ...(taskId === 'DAILY_CHECKIN' ? [{ type: 'DAILY_CHECKIN' }] : [])
        ]
    });

    if (taskAlreadyCompletedInUser || taskAlreadyInDb) {
        return res.status(400).json({
            success: false,
            error: 'You have already claimed this task reward today. Come back tomorrow!'
        });
    }

    // Check daily direct earnings cap
    const directTransactions = await RewardTransaction.find({
        userId: user._id,
        type: { $in: ['WELCOME_INSTALL', 'WELCOME_LOGIN', 'DAILY_CHECKIN', 'FEATURE_USAGE'] }
    });
    const currentDirectCoins = directTransactions.reduce((acc, t) => acc + (t.coins > 0 ? t.coins : 0), 0);

    const taskReward = allowedTasks[taskId];
    if (currentDirectCoins >= cfg.directDailyCapCoins) {
        return res.status(400).json({
            success: false,
            error: `Maximum ₹${cfg.directDailyCapINR} (${cfg.directDailyCapCoins} Coins) direct task earnings limit reached! Refer friends to earn ₹${(cfg.referralBonusCoins / cfg.coinRate).toFixed(2)} (${cfg.referralBonusCoins} Coins) unlimited per invite.`
        });
    }

    // Adjust reward if partially reaching the cap
    const coinsToAward = Math.min(taskReward.coins, cfg.directDailyCapCoins - currentDirectCoins);
    const amountINR = parseFloat((coinsToAward / cfg.coinRate).toFixed(2));

    user.coinsBalance = (user.coinsBalance || 0) + coinsToAward;
    user.totalCoinsEarned = (user.totalCoinsEarned || 0) + coinsToAward;
    if (!user.completedTasks) {
        user.completedTasks = [];
    }
    user.completedTasks.push({
        taskId,
        date: todayStr,
        coins: coinsToAward
    });
    user.markModified('completedTasks');

    if (taskId === 'DAILY_CHECKIN') {
        user.lastDailyCheckin = new Date();
    }

    await user.save();

    const txn = await RewardTransaction.create({
        userId: user._id,
        type: taskId === 'DAILY_CHECKIN' ? 'DAILY_CHECKIN' : 'FEATURE_USAGE',
        coins: coinsToAward,
        amountINR,
        description: taskReward.desc,
        metadata: { taskId, date: todayStr }
    });

    res.status(200).json({
        success: true,
        coinsAwarded: coinsToAward,
        amountINR,
        newBalance: user.coinsBalance,
        message: `🎉 +${coinsToAward} Coins (₹${amountINR.toFixed(2)}) Added to your Rewards Wallet!`,
        transaction: txn
    });
});

// @desc    Submit a withdrawal request
// @route   POST /api/rewards/withdraw
// @access  Private
exports.submitWithdrawal = asyncHandler(async (req, res) => {
    const cfg = await getRewardSystemConfig();
    if (!cfg.isEnabled) {
        return res.status(400).json({ success: false, error: 'Cashout is currently paused by admin.' });
    }

    const { paymentType, upiId, holderName, bankName, accountNumber, ifscCode } = req.body;

    if (!paymentType || !['UPI', 'BANK'].includes(paymentType)) {
        return res.status(400).json({ success: false, error: 'Please choose UPI or Bank payout method.' });
    }

    if (paymentType === 'UPI') {
        if (!upiId || !upiId.includes('@')) {
            return res.status(400).json({ success: false, error: 'Please provide a valid UPI ID (e.g. mobile@okhdfcbank).' });
        }
    } else if (paymentType === 'BANK') {
        if (!holderName || !accountNumber || !ifscCode) {
            return res.status(400).json({ success: false, error: 'Please complete all bank details (Holder name, Account number, IFSC).' });
        }
    }

    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    const currentBalance = user.coinsBalance || 0;

    // Validate against dynamic admin-configured minimum
    if (currentBalance < cfg.minWithdrawalCoins) {
        return res.status(400).json({
            success: false,
            errorCode: 'INSUFFICIENT_BALANCE',
            error: `Minimum ${cfg.minWithdrawalCoins} Coins (₹${cfg.minWithdrawalINR.toFixed(2)}) required for withdrawal. Your balance: ${currentBalance} Coins (₹${(currentBalance / cfg.coinRate).toFixed(2)}).`
        });
    }

    // Prevent duplicate pending requests
    const existingPending = await WithdrawalRequest.findOne({
        userId: user._id,
        status: 'PENDING'
    });
    if (existingPending) {
        return res.status(400).json({
            success: false,
            error: 'You already have a withdrawal request pending admin review. Please wait for it to be processed first.'
        });
    }

    // Compute payout amount from current balance
    const coinsToWithdraw = currentBalance;
    const amountINR = parseFloat((coinsToWithdraw / cfg.coinRate).toFixed(2));

    // --- Build Earning Audit Snapshot for admin's review ---
    const allTxns = await RewardTransaction.find({ userId: user._id });
    const welcomeCoins = allTxns.filter(t => ['WELCOME_LOGIN', 'WELCOME_INSTALL'].includes(t.type)).reduce((a, t) => a + (t.coins > 0 ? t.coins : 0), 0);
    const dailyCheckinCoins = allTxns.filter(t => t.type === 'DAILY_CHECKIN').reduce((a, t) => a + (t.coins > 0 ? t.coins : 0), 0);
    const featureUsageCoins = allTxns.filter(t => t.type === 'FEATURE_USAGE').reduce((a, t) => a + (t.coins > 0 ? t.coins : 0), 0);
    const referralCoins = allTxns.filter(t => t.type === 'REFERRAL_BONUS').reduce((a, t) => a + (t.coins > 0 ? t.coins : 0), 0);

    // Generate cryptographic reference
    const crypto = require('crypto');
    const signaturePayload = `${user._id}:${coinsToWithdraw}:${amountINR}:${Date.now()}`;
    const transactionRef = `REF-${crypto.createHmac('sha256', process.env.JWT_SECRET || 'finance_secret').update(signaturePayload).digest('hex').substring(0, 12).toUpperCase()}`;

    // Create the pending withdrawal — COINS ARE NOT DEDUCTED YET
    // They stay in user's wallet; deduction happens only when admin marks PAID
    const withdrawal = await WithdrawalRequest.create({
        userId: user._id,
        coins: coinsToWithdraw,
        amountINR,
        paymentType,
        upiId: paymentType === 'UPI' ? upiId : undefined,
        bankDetails: paymentType === 'BANK' ? {
            holderName,
            bankName,
            accountNumber,
            ifscCode: ifscCode.toUpperCase()
        } : undefined,
        coinsOnHold: coinsToWithdraw,
        earningSummary: {
            totalCoinsEarned: user.totalCoinsEarned || 0,
            welcomeCoins,
            dailyCheckinCoins,
            featureUsageCoins,
            referralCoins,
            transactionCount: allTxns.length
        },
        status: 'PENDING',
        transactionRef
    });

    // Create a PENDING ledger entry for admin audit trail (does NOT touch balance)
    await RewardTransaction.create({
        userId: user._id,
        type: 'WITHDRAWAL_LOCK',
        coins: 0, // Balance NOT reduced yet — coins still in wallet
        amountINR: 0,
        description: `Cashout Request Submitted: ₹${amountINR.toFixed(2)} via ${paymentType} — Awaiting Admin Approval (${coinsToWithdraw} Coins on hold)`,
        metadata: { withdrawalId: withdrawal._id, coinsOnHold: coinsToWithdraw, transactionRef }
    });

    res.status(200).json({
        success: true,
        message: `✅ Cashout request for ₹${amountINR.toFixed(2)} submitted successfully! Admin will review and transfer within 24 hours.`,
        data: withdrawal
    });
});

// @desc    Get user's past withdrawal requests
// @route   GET /api/rewards/withdrawals
// @access  Private
exports.getWithdrawals = asyncHandler(async (req, res) => {
    const withdrawals = await WithdrawalRequest.find({ userId: req.user.id })
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: withdrawals.length,
        data: withdrawals
    });
});

// @desc    Get referral stats and invited friends list
// @route   GET /api/rewards/referrals
// @access  Private
exports.getReferrals = asyncHandler(async (req, res) => {
    const cfg = await getRewardSystemConfig();
    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    const invitedUsers = await User.find({ referredBy: user._id })
        .select('name email phone createdAt profileImage')
        .sort({ createdAt: -1 });

    const totalEarnedCoins = invitedUsers.length * cfg.referralBonusCoins;
    const totalEarnedINR = totalEarnedCoins / cfg.coinRate;

    res.status(200).json({
        success: true,
        data: {
            referralCode: user.referralCode,
            bonusPerReferralINR: cfg.referralBonusCoins / cfg.coinRate,
            bonusPerReferralCoins: cfg.referralBonusCoins,
            totalReferrals: invitedUsers.length,
            totalEarnedCoins,
            totalEarnedINR,
            invitedUsers
        }
    });
});

// @desc    Apply a friend's referral code after registration / Google login
// @route   POST /api/rewards/apply-referral
// @access  Private
exports.applyReferralCode = asyncHandler(async (req, res) => {
    const cfg = await getRewardSystemConfig();
    if (!cfg.isEnabled) {
        return res.status(400).json({ success: false, error: 'Rewards program is currently paused.' });
    }

    const { referralCode } = req.body;
    if (!referralCode) {
        return res.status(400).json({ success: false, error: 'Please enter a referral code.' });
    }

    const cleanCode = String(referralCode).trim().toUpperCase();
    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.referredBy) {
        return res.status(400).json({ success: false, error: 'You have already applied a referral code previously.' });
    }

    if (user.referralCode && user.referralCode.toUpperCase() === cleanCode) {
        return res.status(400).json({ success: false, error: 'You cannot use your own referral code!' });
    }

    const referrer = await User.findOne({ referralCode: cleanCode });
    if (!referrer) {
        return res.status(404).json({ success: false, error: 'Invalid referral code. Please verify and try again.' });
    }

    if (referrer._id.toString() === user._id.toString()) {
        return res.status(400).json({ success: false, error: 'You cannot use your own referral code!' });
    }

    // Link referrer
    user.referredBy = referrer._id;
    await user.save();

    // Credit referrer dynamic coins (e.g. 200 coins = ₹10)
    referrer.coinsBalance = (referrer.coinsBalance || 0) + cfg.referralBonusCoins;
    referrer.totalCoinsEarned = (referrer.totalCoinsEarned || 0) + cfg.referralBonusCoins;
    await referrer.save();

    await RewardTransaction.create({
        userId: referrer._id,
        type: 'REFERRAL_BONUS',
        coins: cfg.referralBonusCoins,
        amountINR: cfg.referralBonusCoins / cfg.coinRate,
        description: `Referral Reward: ${user.name || user.email || 'Friend'} applied your code (₹${(cfg.referralBonusCoins / cfg.coinRate).toFixed(2)})`,
        metadata: { referredUserId: user._id }
    });

    res.status(200).json({
        success: true,
        message: `🎉 Referral code applied successfully! Your friend received ₹${(cfg.referralBonusCoins / cfg.coinRate).toFixed(2)} reward.`,
        newBalance: user.coinsBalance
    });
});
