const Listing = require('../models/Listing');
const User = require('../models/User');
const asyncHandler = require('../middlewares/async');

// Helper to calculate distance in KM between two coordinates
const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

// @desc    Get all listings
// @route   GET /api/listings
// @access  Public
exports.getListings = asyncHandler(async (req, res, next) => {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit', 'lat', 'lng', 'radius', 'search'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    let parsedQuery = JSON.parse(queryStr);
    
    // Mount GeoSpatial Distance Sorting Algorithm
    if (req.query.lat && req.query.lng) {
        parsedQuery.geoSpatialLocation = {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [ parseFloat(req.query.lng), parseFloat(req.query.lat) ]
                }
            }
        };
        
        // Optional bounding (defaults to no limits, returning everything inherently sorted by precise proximity)
        if (req.query.radius) {
            parsedQuery.geoSpatialLocation.$near.$maxDistance = parseFloat(req.query.radius) * 1000;
        }
    }
    
    if (req.query.search) {
        parsedQuery.$text = { $search: req.query.search };
    }

    // Filter out tokened/reserved properties by default to keep search inventory fresh
    if (!parsedQuery.isTokened) {
        parsedQuery.isTokened = { $ne: true };
    }
    if (!parsedQuery.status) {
        parsedQuery.status = { $ne: 'Reserved' };
    }

    // Explicitly handle Min/Max Price mapping
    if (req.query.minPrice || req.query.maxPrice) {
        parsedQuery.price = {};
        if (req.query.minPrice) parsedQuery.price.$gte = Number(req.query.minPrice);
        if (req.query.maxPrice) parsedQuery.price.$lte = Number(req.query.maxPrice);
        delete parsedQuery.minPrice;
        delete parsedQuery.maxPrice;
    }

    // Explicitly handle Min/Max Area mapping
    if (req.query.minArea || req.query.maxArea) {
        parsedQuery.numericArea = {};
        if (req.query.minArea) parsedQuery.numericArea.$gte = Number(req.query.minArea);
        if (req.query.maxArea) parsedQuery.numericArea.$lte = Number(req.query.maxArea);
        delete parsedQuery.minArea;
        delete parsedQuery.maxArea;
    }

    // Finding resource
    console.log('Final Search Query:', JSON.stringify(parsedQuery, null, 2));
    query = Listing.find(parsedQuery).select('-description -videos -documents').populate({
        path: 'createdBy',
        select: 'name email phone role'
    });

    // Sort (Avoid explicit sort overriding if $near geometry ranks by distance natively)
    if (req.query.sort && !(req.query.lat && req.query.lng) && req.query.sort !== 'trending') {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else if (!(req.query.lat && req.query.lng) && req.query.sort !== 'trending') {
        query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    // Fix for MongoServerError: $geoNear, $near, and $nearSphere are not allowed in countDocuments
    let countQuery = { ...parsedQuery };
    if (countQuery.geoSpatialLocation && countQuery.geoSpatialLocation.$near) {
        if (req.query.radius) {
            countQuery.geoSpatialLocation = {
                $geoWithin: {
                    $centerSphere: [
                        [ parseFloat(req.query.lng), parseFloat(req.query.lat) ],
                        parseFloat(req.query.radius) / 6378.1 // Convert radius in km to radians
                    ]
                }
            };
        } else {
            delete countQuery.geoSpatialLocation;
        }
    }

    const total = await Listing.countDocuments(countQuery);
    
    // Production optimization: If total results are cached or known, we could skip count, 
    // but for now, we keep it for accurate pagination.

    // Executing query
    let listings;
    if (req.query.sort === 'trending') {
        const trendingListings = await Listing.aggregate([
            { $match: parsedQuery },
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
            { $skip: startIndex },
            { $limit: limit },
            {
                $lookup: {
                    from: 'users',
                    localField: 'createdBy',
                    foreignField: '_id',
                    as: 'createdBy'
                }
            },
            { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    'createdBy.password': 0,
                    'createdBy.token': 0
                }
            }
        ]);
        listings = trendingListings;
    } else {
        // If Geospatial $near is active, DO NOT explicit sort as it breaks proximity ranking
        if (req.query.lat && req.query.lng) {
            query = query.skip(startIndex).limit(limit).lean();
        } else {
            query = query.skip(startIndex).limit(limit).sort('-createdAt').lean();
        }
        listings = await query;
        // Convert to plain objects for distance calc if needed
        listings = listings.map(l => (l.toObject ? l.toObject() : l));
    }
    console.log(`Found ${listings.length} listings for query.`);

    // Attach distance if coordinates were provided
    if (req.query.lat && req.query.lng) {
        const userLat = parseFloat(req.query.lat);
        const userLng = parseFloat(req.query.lng);
        
        listings = listings.map(listing => {
            if (listing.geoSpatialLocation && listing.geoSpatialLocation.coordinates) {
                // GeoJSON format is [longitude, latitude]
                const [lng, lat] = listing.geoSpatialLocation.coordinates;
                listing.distance = getDistanceInKm(userLat, userLng, lat, lng);
            }
            return listing;
        });
    }

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
        pagination.next = {
            page: page + 1,
            limit
        };
    }

    if (startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            limit
        };
    }

    res.status(200).json({
        success: true,
        count: listings.length,
        total,
        pagination,
        data: listings
    });
});

// @desc    Get search suggestions
// @route   GET /api/listings/search/suggestions?q=keyword
// @access  Public
exports.getSearchSuggestions = asyncHandler(async (req, res, next) => {
    const { q } = req.query;
    if (!q || q.length < 2) return res.status(200).json({ success: true, data: [] });

    // Leverage Weighted $text index primarily
    let results = await Listing.find(
        { $text: { $search: q }, status: { $ne: 'Inactive' } },
        { score: { $meta: "textScore" } }
    )
    .sort({ score: { $meta: "textScore" } })
    .limit(8)
    .select('title location price listingType images area');

    // Fallback: If strict indexing fails, rely on robust multi-node regex engine
    if (results.length === 0) {
        results = await Listing.find({
            status: { $ne: 'Inactive' },
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { location: { $regex: q, $options: 'i' } }
            ]
        })
        .sort('-views')
        .limit(8)
        .select('title location price listingType images area');
    }

    res.status(200).json({ success: true, data: results });
});

// @desc    Get nearby properties using 2dsphere mapping
// @route   GET /api/listings/nearby?lat=...&lng=...&radius=...
// @access  Public
exports.getNearbyListings = asyncHandler(async (req, res, next) => {
    const { lat, lng, radius } = req.query; 
    
    if (!lat || !lng) {
        return res.status(400).json({ success: false, error: 'Spatial constraints require both valid Latitude and Longitude.' });
    }

    const radiusInKm = radius || 25; // Default 25km bounds

    const listings = await Listing.find({
        status: { $ne: 'Inactive' },
        geoSpatialLocation: {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [ parseFloat(lng), parseFloat(lat) ]
                },
                $maxDistance: radiusInKm * 1000 // MongoDB near requires meters
            }
        }
    }).populate('createdBy', 'name role');

    res.status(200).json({
        success: true,
        count: listings.length,
        data: listings
    });
});

// @desc    Get single listing
// @route   GET /api/listings/:id
// @access  Public
exports.getListing = asyncHandler(async (req, res, next) => {
    const isId = req.params.id.match(/^[0-9a-fA-F]{24}$/);
    
    const listing = await (isId 
        ? Listing.findById(req.params.id) 
        : Listing.findOne({ slug: req.params.id }))
        .populate({
            path: 'createdBy',
            select: 'name email phone role'
        });

    if (!listing) {
        return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    res.status(200).json({ success: true, data: listing });
});

// @desc    Record unique listing view
// @route   POST /api/listings/:id/view
// @access  Public
exports.recordView = asyncHandler(async (req, res, next) => {
    const listing = await Listing.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    if (!listing) return res.status(404).json({ success: false, error: 'Listing not found' });
    res.status(200).json({ success: true });
});

// @desc    Create new listing
// @route   POST /api/listings
// @access  Private (Seller/Broker/Admin)
exports.createListing = asyncHandler(async (req, res, next) => {
    req.body.createdBy = req.user.id;
    
    // Force Active status
    req.body.status = 'Active';

    // Enforce 2% Token Price Cap
    if (req.body.isBookingEnabled && req.body.tokenAmount && req.body.price) {
        req.body.tokenAmount = Math.min(Number(req.body.tokenAmount), Number(req.body.price) * 0.02);
    } else if (!req.body.isBookingEnabled) {
        req.body.tokenAmount = 0;
        req.body.payoutAccountId = null;
    }

    // Ensure payoutAccountId is provided if booking is enabled
    if (req.body.isBookingEnabled && !req.body.payoutAccountId) {
        return res.status(400).json({ success: false, error: 'Please select a payout account to enable token booking.' });
    }

    // Inject GeoJSON logic if coordinates are provided
    if (req.body.mapCoordinates && req.body.mapCoordinates.lat && req.body.mapCoordinates.lng) {
        req.body.geoSpatialLocation = {
            type: "Point",
            coordinates: [ parseFloat(req.body.mapCoordinates.lng), parseFloat(req.body.mapCoordinates.lat) ]
        };
    }

    const listing = await Listing.create(req.body);

    res.status(201).json({
        success: true,
        data: listing
    });
});

// @desc    Update listing
// @route   PUT /api/listings/:id
// @access  Private
exports.updateListing = asyncHandler(async (req, res, next) => {
    let listing = await Listing.findById(req.params.id);

    if (!listing) {
        return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    // Make sure user is listing owner or admin
    if (listing.createdBy.toString() !== req.user.id && req.user.role !== 'Admin') {
        return res.status(401).json({ success: false, error: 'Not authorized to update this listing' });
    }

    // Strip verification-related fields from updates
    delete req.body.listingType;
    delete req.body.verifiedBy;
    delete req.body.verifiedAt;

    // Enforce 2% Token Price Cap
    if (req.body.isBookingEnabled && req.body.tokenAmount && (req.body.price || listing.price)) {
        const finalPrice = req.body.price || listing.price;
        req.body.tokenAmount = Math.min(Number(req.body.tokenAmount), Number(finalPrice) * 0.02);
    } else if (req.body.isBookingEnabled === false) {
        req.body.tokenAmount = 0;
        req.body.payoutAccountId = null;
    }

    // Ensure payoutAccountId is provided if booking is enabled
    if (req.body.isBookingEnabled && !req.body.payoutAccountId && !listing.payoutAccountId) {
        return res.status(400).json({ success: false, error: 'Please select a payout account to enable token booking.' });
    }

    // Inject GeoJSON logic if coordinates are provided
    if (req.body.mapCoordinates && req.body.mapCoordinates.lat && req.body.mapCoordinates.lng) {
        req.body.geoSpatialLocation = {
            type: "Point",
            coordinates: [ parseFloat(req.body.mapCoordinates.lng), parseFloat(req.body.mapCoordinates.lat) ]
        };
    }

    listing = await Listing.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    const io = req.app.get('io');
    if (io) {
        io.to(listing.createdBy.toString()).emit('listing_updated', listing);
    }

    res.status(200).json({ success: true, data: listing });
});

// @desc    Delete listing
// @route   DELETE /api/listings/:id
// @access  Private
exports.deleteListing = asyncHandler(async (req, res, next) => {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
        return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    // Make sure user is listing owner or admin
    if (listing.createdBy.toString() !== req.user.id && req.user.role !== 'Admin') {
        return res.status(401).json({ success: false, error: 'Not authorized to delete this listing' });
    }

    await Listing.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, data: {} });
});

// @desc    Request verification for a basic listing
// @route   PATCH /api/listings/:id/request-verification
// @access  Private
exports.requestVerification = asyncHandler(async (req, res, next) => {
    let listing = await Listing.findById(req.params.id);

    if (!listing) {
        return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    // Make sure user is owner
    if (listing.createdBy.toString() !== req.user.id && req.user.role !== 'Admin') {
        return res.status(401).json({ success: false, error: 'Not authorized to verify request' });
    }

    listing.status = 'PendingVerification';
    await listing.save();

    res.status(200).json({ success: true, data: listing });
});

// @desc    Admin Verify listing
// @route   PATCH /api/listings/:id/verify
// @access  Private (Admin)
exports.verifyListing = asyncHandler(async (req, res, next) => {
    let listing = await Listing.findById(req.params.id);

    if (!listing) {
        return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    listing.status = 'Verified';
    listing.listingType = 'Verified';
    listing.verifiedBy = req.user.id;
    listing.verifiedAt = Date.now();
    
    if (req.body.tokenAmount) listing.tokenAmount = req.body.tokenAmount;
    if (req.body.mapCoordinates) {
        listing.mapCoordinates = req.body.mapCoordinates;
        // Inject GeoJSON logic dynamically
        listing.geoSpatialLocation = {
            type: "Point",
            coordinates: [ parseFloat(req.body.mapCoordinates.lng), parseFloat(req.body.mapCoordinates.lat) ]
        };
    }
    
    if (req.body.documents && req.body.documents.length > 0) listing.documents = [...(listing.documents || []), ...req.body.documents];
    if (req.body.videos && req.body.videos.length > 0) listing.videos = [...(listing.videos || []), ...req.body.videos];
    if (req.body.images && req.body.images.length > 0) listing.images = [...(listing.images || []), ...req.body.images];

    await listing.save();

    const io = req.app.get('io');
    if (io) {
        io.to(listing.createdBy.toString()).emit('listing_verified', listing);
    }

    res.status(200).json({ success: true, data: listing });
});

// @desc    Admin Reject listing
// @route   PATCH /api/listings/:id/reject-verification
// @access  Private (Admin)
exports.rejectVerification = asyncHandler(async (req, res, next) => {
    let listing = await Listing.findById(req.params.id);

    if (!listing) {
        return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    listing.status = 'Rejected';
    await listing.save();

    const io = req.app.get('io');
    if (io) {
        io.to(listing.createdBy.toString()).emit('listing_rejected', listing);
    }

    res.status(200).json({ success: true, data: listing });
});

// @desc    Reserve listing
// @route   PATCH /api/listings/:id/reserve
// @access  Private
exports.reserveListing = asyncHandler(async (req, res, next) => {
    let listing = await Listing.findById(req.params.id);

    if (!listing) {
        return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    listing.status = 'Reserved';
    await listing.save();

    const io = req.app.get('io');
    if (io) {
        io.to(listing.createdBy.toString()).emit('listing_reserved', listing);
    }

    res.status(200).json({ success: true, data: listing });
});

// @desc    Get user's tokened/reserved properties
// @route   GET /api/listings/my/tokened
// @access  Private
exports.getMyTokenedListings = asyncHandler(async (req, res, next) => {
    const Transaction = require('../models/Transaction');
    
    // Find all successful transactions for this user
    const transactions = await Transaction.find({ 
        buyerId: req.user.id,
        status: 'Captured' 
    }).populate({
        path: 'listingId',
        populate: {
            path: 'createdBy',
            select: 'name email phone role'
        }
    });

    // Extract unique listings from transactions
    const listings = transactions
        .map(t => t.listingId)
        .filter(l => l !== null); // Remove any null references if listing was deleted

    res.status(200).json({
        success: true,
        count: listings.length,
        data: listings
    });
});
// @desc    Get seller profile with categorized listings
// @route   GET /api/listings/seller/:id
// @access  Public
exports.getSellerProfile = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id).select('name role email phone createdAt');
    
    if (!user) {
        return res.status(404).json({ success: false, error: 'Seller not found' });
    }

    const allListings = await Listing.find({ createdBy: req.params.id })
        .select('-description -videos -documents')
        .sort('-createdAt')
        .lean();
    
    const activeListings = allListings.filter(l => l.status === 'Active' && !l.isTokened);
    const reservedListings = allListings.filter(l => l.isTokened);

    res.status(200).json({
        success: true,
        data: {
            user,
            activeListings,
            reservedListings
        }
    });
});
