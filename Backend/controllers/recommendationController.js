const Listing = require('../models/Listing');
const UserActivity = require('../models/UserActivity');
const asyncHandler = require('../middlewares/async');
const jwt = require('jsonwebtoken');

// Helper to silently verify token without crashing out if missing
const getMildUser = (req) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return null;
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch(err) {
        return null; // Guest user basically
    }
};

// @desc    Get Personalized Recommendations
// @route   GET /api/recommendations/personalized
// @access  Public (Graceful Degradation for Guests)
exports.getPersonalized = asyncHandler(async (req, res, next) => {
    const user = getMildUser(req);
    
    // If not logged in, seamlessly fallback to the global trending engine
    if (!user) {
        return exports.getTrending(req, res, next);
    }
    
    // Analyze granular historical vectors for logged-in users
    const activities = await UserActivity.find({ userId: user.id })
        .sort('-createdAt')
        .limit(20)
        .populate('actionDetails.listingId', 'location price area');
        
    let targetLoc = null;
    let targetPrice = null;

    if (activities.length > 0) {
        for(let act of activities) {
            if(act.actionDetails.searchTerm) { targetLoc = act.actionDetails.searchTerm; }
            if(act.actionDetails.listingId?.location) { targetLoc = act.actionDetails.listingId.location; }
            if(act.actionDetails.listingId?.price) { targetPrice = act.actionDetails.listingId.price; }
            if(targetLoc) break;
        }
    }
    
    let query = { status: { $ne: 'Inactive' } };
    
    if (targetLoc) {
        query.$or = [
            { location: { $regex: targetLoc.split(',')[0], $options: 'i' } }
        ];
    }
    
    // If no data points gathered, show generic latest verified hits
    if (!targetLoc) {
        query.listingType = 'Verified';
    }

    const recs = await Listing.find(query).sort('-createdAt').limit(6);
    res.status(200).json({ success: true, data: recs });
});

// @desc    Get Similar properties utilizing price bounds and locale string matching
// @route   GET /api/recommendations/similar/:id
// @access  Public
exports.getSimilar = asyncHandler(async (req, res, next) => {
    const baseListing = await Listing.findById(req.params.id);
    if (!baseListing) {
        return res.status(404).json({ success: false, error: 'Target Listing Data Corrupted' });
    }

    // Similarity vector generation bounds (+/- 25% pricing flexibility)
    const priceRange = baseListing.price * 0.25;
    const baseLoc = baseListing.location.split(',')[0].trim();
    
    const similar = await Listing.find({
        _id: { $ne: baseListing._id },
        status: { $ne: 'Inactive' },
        $or: [
            { location: { $regex: baseLoc, $options: 'i' } },
            { price: { $gte: baseListing.price - priceRange, $lte: baseListing.price + priceRange } }
        ]
    })
    .sort('-views')
    .limit(6);

    res.status(200).json({ success: true, data: similar });
});

// @desc    Get Trending properties globally via Aggregate Scoring Algorithm
// @route   GET /api/recommendations/trending
// @access  Public
exports.getTrending = asyncHandler(async (req, res, next) => {
    // Machine scoring: Weighted formula extracting dynamic interactions
    // Score = (Contacts * 10) + (Favorites * 5) + Views (1)
    const trending = await Listing.aggregate([
        { 
            $match: { 
                status: 'Active' 
            } 
        },
        { 
            $addFields: {
                trendingScore: {
                    $add: [
                        { $multiply: [{ $ifNull: ["$contacts", 0] }, 10] },
                        { $multiply: [{ $ifNull: ["$favoritesCount", 0] }, 5] },
                        { $ifNull: ["$views", 0] }
                    ]
                }
            }
        },
        { $sort: { trendingScore: -1 } },
        { $limit: 6 }
    ]);
    
    // Explicitly populate user details for the Search.jsx style cards
    const populatedTrending = await Listing.populate(trending, {
        path: 'createdBy',
        select: 'name email phone role'
    });
    
    res.status(200).json({ success: true, data: populatedTrending });
});
