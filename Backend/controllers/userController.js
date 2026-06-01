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
                listingsCount: { $ifNull: [{ $size: '$listingStats' }, 0] }
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
    const users = await User.find();
    res.status(200).json({ success: true, count: users.length, data: users });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
    const allowedFields = ['name', 'email', 'phone', 'role', 'accountStatus', 'isVerified'];
    const fieldsToUpdate = {};
    allowedFields.forEach((field) => {
        if (typeof req.body[field] !== 'undefined') {
            fieldsToUpdate[field] = req.body[field];
        }
    });

    const existingUser = await User.findById(req.params.id);
    if (!existingUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
        new: true,
        runValidators: true
    });

    if (fieldsToUpdate.accountStatus) {
        const isActive = fieldsToUpdate.accountStatus === 'Active';
        await setUserListingsVisibility(user._id, isActive);
        if (!isActive) {
            await revokeUserSessions(user._id);
        }
    }

    res.status(200).json({ success: true, data: user });
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
