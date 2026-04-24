const Listing = require('../models/Listing');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Inquiry = require('../models/Inquiry');
const PageHit = require('../models/PageHit');
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
    
    const recentListings = await Listing.find().sort('-createdAt').limit(10).populate('createdBy', 'name email role');
    
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
                createdAt: 1,
                listingCount: { $size: "$userListings" }
            }
        },
        { $sort: { createdAt: -1 } }
    ]);

    // Page Hits
    const pageHits = await PageHit.find().sort({ date: -1, hits: -1 });


    
    // All listings for property management
    const allListings = await Listing.find().sort('-createdAt').populate('createdBy', 'name email role');

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
