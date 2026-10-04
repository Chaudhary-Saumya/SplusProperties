const User = require('../models/User');
const Listing = require('../models/Listing');
const asyncHandler = require('../middlewares/async');
const {
    setUserListingsVisibility,
    revokeUserSessions,
    deleteUserAndRelatedData
} = require('../utils/userCleanup');

// @desc    Get brokers with active listings count
// @route   GET /api/users/brokers
// @access  Public
exports.getBrokers = asyncHandler(async (req, res, next) => {
    const brokers = await User.aggregate([
        { $match: { role: 'Broker', accountStatus: { $nin: ['Disabled', 'Suspended'] } } },
        {
            $lookup: {
                from: 'listings',
                let: { userId: '$_id' },
                pipeline: [
                    { $match: { 
                        $expr: { $eq: ['$createdBy', '$$userId'] },
                        status: { $nin: ['Reserved', 'Sold'] }
                    }},
                    { $count: 'count' }
                ],
                as: 'listingStats'
            }
        },
        {
            $addFields: {
                listingsCount: { $ifNull: [{ $arrayElemAt: ['$listingStats.count', 0] }, 0] }
            }
        },
        {
            $project: {
                password: 0,
                otp: 0,
                otpExpire: 0,
                paymentAccounts: 0,
                favorites: 0
            }
        },
        { $sort: { listingsCount: -1 } },
        { $limit: 20 }
    ]);
    
    res.status(200).json({
        success: true,
        count: brokers.length,
        data: brokers
    });
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
    const users = await User.find().select('+password').sort('-createdAt');
    const transformed = users.map(u => {
        const uObj = u.toObject();
        uObj.hasPassword = Boolean(u.password);
        uObj.authProvider = (u.googleId && u.password) ? 'Both' : u.googleId ? 'Google' : 'Manual';
        delete uObj.password;
        delete uObj.otp;
        return uObj;
    });
    res.status(200).json({ success: true, count: transformed.length, data: transformed });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id).select('+password');
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }
    const uObj = user.toObject();
    uObj.hasPassword = Boolean(user.password);
    uObj.authProvider = (user.googleId && user.password) ? 'Both' : user.googleId ? 'Google' : 'Manual';
    delete uObj.password;
    delete uObj.otp;
    res.status(200).json({ success: true, data: uObj });
});

// @desc    Update user (Admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id).select('+password');
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    const {
        name,
        email,
        phone,
        role,
        accountStatus,
        coinsBalance,
        isVerified,
        identityVerified,
        documentVerified,
        password
    } = req.body;

    // Check unique email if modified
    if (email && email.toLowerCase().trim() !== user.email) {
        const existingEmail = await User.findOne({ 
            email: email.toLowerCase().trim(), 
            _id: { $ne: user._id } 
        });
        if (existingEmail) {
            return res.status(400).json({ success: false, error: 'Email address is already in use by another account' });
        }
        user.email = email.toLowerCase().trim();
    }

    // Check unique phone if modified
    if (typeof phone !== 'undefined' && phone !== user.phone) {
        if (phone && phone.trim()) {
            const existingPhone = await User.findOne({ 
                phone: phone.trim(), 
                _id: { $ne: user._id } 
            });
            if (existingPhone) {
                return res.status(400).json({ success: false, error: 'Phone number is already in use by another account' });
            }
            user.phone = phone.trim();
        } else {
            user.phone = undefined;
        }
    }

    if (name) user.name = name.trim();
    if (role && ['User', 'Buyer', 'Seller', 'Broker', 'Admin'].includes(role)) user.role = role;
    
    let statusChanged = false;
    if (accountStatus && ['Active', 'Disabled', 'Suspended'].includes(accountStatus)) {
        if (user.accountStatus !== accountStatus) {
            statusChanged = true;
            user.accountStatus = accountStatus;
        }
    }

    if (typeof coinsBalance !== 'undefined' && !isNaN(Number(coinsBalance))) {
        user.coinsBalance = Math.max(0, Number(coinsBalance));
    }

    if (typeof isVerified !== 'undefined') user.isVerified = Boolean(isVerified);
    if (typeof identityVerified !== 'undefined') user.identityVerified = Boolean(identityVerified);
    if (typeof documentVerified !== 'undefined') user.documentVerified = Boolean(documentVerified);

    let passwordChanged = false;
    if (password && typeof password === 'string' && password.trim()) {
        if (password.trim().length < 6) {
            return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
        }
        user.password = password.trim();
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        passwordChanged = true;
    }

    // Save with Mongoose pre('save') hooks for password encryption
    await user.save();

    if (statusChanged) {
        const isActive = user.accountStatus === 'Active';
        await setUserListingsVisibility(user._id, isActive);
        if (!isActive) {
            await revokeUserSessions(user._id);
        }
    }

    if (passwordChanged) {
        await revokeUserSessions(user._id);
    }

    const uObj = user.toObject();
    uObj.hasPassword = Boolean(user.password);
    uObj.authProvider = (user.googleId && user.password) ? 'Both' : user.googleId ? 'Google' : 'Manual';
    delete uObj.password;
    delete uObj.otp;

    res.status(200).json({ 
        success: true, 
        message: passwordChanged ? 'User profile and password updated successfully' : 'User profile updated successfully',
        data: uObj 
    });
});

// @desc    Reset user password (Admin direct action with Master PIN)
// @route   PUT /api/users/:id/reset-password
// @access  Private/Admin
exports.resetUserPassword = asyncHandler(async (req, res, next) => {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.trim().length < 6) {
        return res.status(400).json({ 
            success: false, 
            error: 'Please provide a valid new password (minimum 6 characters)' 
        });
    }

    const user = await User.findById(req.params.id).select('+password');
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Security Defense: Admins cannot reset passwords for other Admin accounts
    if (user.role === 'Admin' && req.user._id.toString() !== user._id.toString()) {
        const logger = require('../utils/logger');
        logger.warn(`[SECURITY ALERT] Admin ${req.user.email} attempted unauthorized password reset on Admin account ${user.email}`);
        return res.status(403).json({
            success: false,
            error: 'ACCESS DENIED: Administrator accounts cannot be reset via user management for security protection.'
        });
    }

    user.password = newPassword.trim();
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    // Revoke any active JWT sessions for security
    await revokeUserSessions(user._id);

    const logger = require('../utils/logger');
    logger.warn(`[SECURITY AUDIT] Admin ${req.user.email} (ID: ${req.user._id}) reset password for user ${user.email} (ID: ${user._id}) from IP: ${req.ip}`);

    const uObj = user.toObject();
    uObj.hasPassword = true;
    uObj.authProvider = user.googleId ? 'Both' : 'Manual';
    delete uObj.password;
    delete uObj.otp;

    res.status(200).json({
        success: true,
        message: `Password successfully updated for user ${user.name || user.email}`,
        data: uObj
    });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
    if (req.params.id.toString() === req.user.id.toString()) {
        return res.status(400).json({ success: false, error: 'Admin cannot delete their own account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    const { deletedListings } = await deleteUserAndRelatedData(req.params.id);

    res.status(200).json({
        success: true,
        message: 'User and related data deleted',
        data: { deletedListings }
    });
});
