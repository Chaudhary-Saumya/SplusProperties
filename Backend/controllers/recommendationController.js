const Listing = require('../models/Listing');
const UserActivity = require('../models/UserActivity');
const asyncHandler = require('../middlewares/async');
const jwt = require('jsonwebtoken');

// Helper to silently verify token without crashing if missing
const getMildUser = (req) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return null;
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return null; // Guest user
    }
};

/**
 * Builds user preference profile from activity history.
 */
const buildUserPreferenceProfile = async (userId) => {
    const activities = await UserActivity.find({ userId })
        .sort('-createdAt')
        .limit(30)
        .populate('actionDetails.listingId');

    const profile = {
        cities: {},
        landTypes: {},
        plotTypes: {},
        prices: [],
        sellers: {}
    };

    activities.forEach(act => {
        const listing = act.actionDetails.listingId;
        if (!listing) return;

        if (listing.city) profile.cities[listing.city] = (profile.cities[listing.city] || 0) + 1;
        if (listing.landType) profile.landTypes[listing.landType] = (profile.landTypes[listing.landType] || 0) + 1;
        if (listing.plotType) profile.plotTypes[listing.plotType] = (profile.plotTypes[listing.plotType] || 0) + 1;
        if (listing.price) profile.prices.push(listing.price);
        if (listing.createdBy) {
            const sId = listing.createdBy.toString();
            profile.sellers[sId] = (profile.sellers[sId] || 0) + 1;
        }
    });

    // Extract top preferred parameters
    const getTopKey = (obj) => {
        const sorted = Object.entries(obj).sort((a, b) => b[1] - a[1]);
        return sorted.length > 0 ? sorted[0][0] : null;
    };

    const preferredCity = getTopKey(profile.cities);
    const preferredLandType = getTopKey(profile.landTypes);
    const preferredPlotType = getTopKey(profile.plotTypes);
    const preferredSeller = getTopKey(profile.sellers);

    let priceMin = null;
    let priceMax = null;
    if (profile.prices.length > 0) {
        const avgPrice = profile.prices.reduce((sum, p) => sum + p, 0) / profile.prices.length;
        priceMin = avgPrice * 0.7; // +/- 30% tolerance
        priceMax = avgPrice * 1.3;
    }

    return {
        preferredCity,
        preferredLandType,
        preferredPlotType,
        preferredSeller,
        priceMin,
        priceMax
    };
};

// @desc    Get Personalized Recommendations (Recommended For You)
// @route   GET /api/recommendations/personalized
// @access  Public (Fallback for Guest)
exports.getPersonalized = asyncHandler(async (req, res, next) => {
    const user = getMildUser(req);
    if (!user) {
        return exports.getTrending(req, res, next);
    }

    const pref = await buildUserPreferenceProfile(user.id);
    const query = { status: 'Active', isTokened: { $ne: true } };

    if (pref.preferredCity) {
        query.city = new RegExp(`^${pref.preferredCity}$`, 'i');
    }
    if (pref.preferredLandType && pref.preferredLandType !== 'None') {
        query.landType = pref.preferredLandType;
    }
    if (pref.priceMin && pref.priceMax) {
        query.price = { $gte: pref.priceMin, $lte: pref.priceMax };
    }

    let recs = await Listing.find(query)
        .sort('-rankingScore')
        .limit(6)
        .populate('createdBy', 'name email phone role trustScore');

    // Fallback if matched queries are insufficient
    if (recs.length < 3) {
        recs = await Listing.find({ status: 'Active', isTokened: { $ne: true } })
            .sort('-rankingScore')
            .limit(6)
            .populate('createdBy', 'name email phone role trustScore');
    }

    res.status(200).json({ success: true, data: recs });
});

// @desc    Get Similar properties matching current one
// @route   GET /api/recommendations/similar/:id
// @access  Public
exports.getSimilar = asyncHandler(async (req, res, next) => {
    const baseListing = await Listing.findById(req.params.id);
    if (!baseListing) {
        return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    const priceRange = baseListing.price * 0.25;
    const query = {
        _id: { $ne: baseListing._id },
        status: 'Active',
        isTokened: { $ne: true },
        $or: []
    };

    if (baseListing.city) {
        query.$or.push({ city: new RegExp(`^${baseListing.city}$`, 'i') });
    }
    if (baseListing.propertyType) {
        query.$or.push({ propertyType: baseListing.propertyType });
    }
    query.$or.push({ price: { $gte: baseListing.price - priceRange, $lte: baseListing.price + priceRange } });

    const similar = await Listing.find(query)
        .sort('-rankingScore')
        .limit(6)
        .populate('createdBy', 'name email phone role trustScore');

    res.status(200).json({ success: true, data: similar });
});

// @desc    Get Trending properties globally (Recently Trending)
// @route   GET /api/recommendations/trending
// @access  Public
exports.getTrending = asyncHandler(async (req, res, next) => {
    const trending = await Listing.find({ status: 'Active', isTokened: { $ne: true } })
        .sort('-trendingScore')
        .limit(6)
        .populate('createdBy', 'name email phone role trustScore');

    res.status(200).json({ success: true, data: trending });
});

// @desc    Get co-occurrence recommendations (People Also Viewed)
// @route   GET /api/recommendations/also-viewed/:id
// @access  Public
exports.getPeopleAlsoViewed = asyncHandler(async (req, res, next) => {
    const targetListingId = req.params.id;

    // Find users/sessions who viewed this listing
    const targetViews = await UserActivity.find({
        actionType: 'VIEW',
        'actionDetails.listingId': targetListingId
    }).select('userId sessionId');

    const userIds = targetViews.map(v => v.userId).filter(Boolean);
    const sessionIds = targetViews.map(v => v.sessionId).filter(Boolean);

    // Find other listings viewed by those users/sessions
    const coOccurringViews = await UserActivity.aggregate([
        {
            $match: {
                actionType: 'VIEW',
                'actionDetails.listingId': { $ne: targetListingId },
                $or: [
                    { userId: { $in: userIds } },
                    { sessionId: { $in: sessionIds } }
                ]
            }
        },
        {
            $group: {
                _id: '$actionDetails.listingId',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 6 }
    ]);

    const alsoViewedIds = coOccurringViews.map(v => v._id);
    let listings = await Listing.find({
        _id: { $in: alsoViewedIds },
        status: 'Active',
        isTokened: { $ne: true }
    }).populate('createdBy', 'name email phone role trustScore');

    if (listings.length < 3) {
        // Fallback to highest quality in same city
        const base = await Listing.findById(targetListingId);
        const cityFilter = base?.city ? { city: new RegExp(`^${base.city}$`, 'i') } : {};
        listings = await Listing.find({
            _id: { $ne: targetListingId },
            status: 'Active',
            isTokened: { $ne: true },
            ...cityFilter
        })
        .sort('-qualityScore')
        .limit(6)
        .populate('createdBy', 'name email phone role trustScore');
    }

    res.status(200).json({ success: true, data: listings });
});

// @desc    Get recommendations driven by last-viewed category (Because You Viewed)
// @route   GET /api/recommendations/because-you-viewed
// @access  Public
exports.getBecauseYouViewed = asyncHandler(async (req, res, next) => {
    const user = getMildUser(req);
    if (!user) {
        return exports.getTrending(req, res, next);
    }

    // Find last viewed listing
    const lastView = await UserActivity.findOne({
        userId: user.id,
        actionType: 'VIEW'
    }).sort('-createdAt').populate('actionDetails.listingId');

    if (!lastView || !lastView.actionDetails.listingId) {
        return exports.getTrending(req, res, next);
    }

    const base = lastView.actionDetails.listingId;
    const query = {
        _id: { $ne: base._id },
        status: 'Active',
        isTokened: { $ne: true }
    };
    if (base.city) query.city = new RegExp(`^${base.city}$`, 'i');
    if (base.propertyType) query.propertyType = base.propertyType;

    const listings = await Listing.find(query)
        .sort('-rankingScore')
        .limit(6)
        .populate('createdBy', 'name email phone role trustScore');

    res.status(200).json({ success: true, data: listings });
});

// @desc    Get fresh listings matching user preference vectors
// @route   GET /api/recommendations/new-matches
// @access  Public
exports.getNewMatches = asyncHandler(async (req, res, next) => {
    const user = getMildUser(req);
    if (!user) {
        // Fallback for guests: newest listings
        const newest = await Listing.find({ status: 'Active', isTokened: { $ne: true } })
            .sort('-createdAt')
            .limit(6)
            .populate('createdBy', 'name email phone role trustScore');
        return res.status(200).json({ success: true, data: newest });
    }

    const pref = await buildUserPreferenceProfile(user.id);
    const query = {
        status: 'Active',
        isTokened: { $ne: true },
        // Fresh listings check: created in last 14 days
        createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
    };

    if (pref.preferredCity) {
        query.city = new RegExp(`^${pref.preferredCity}$`, 'i');
    }

    let listings = await Listing.find(query)
        .sort('-rankingScore')
        .limit(6)
        .populate('createdBy', 'name email phone role trustScore');

    if (listings.length < 3) {
        // Fallback: newest listings overall
        listings = await Listing.find({ status: 'Active', isTokened: { $ne: true } })
            .sort('-createdAt')
            .limit(6)
            .populate('createdBy', 'name email phone role trustScore');
    }

    res.status(200).json({ success: true, data: listings });
});
