const Listing = require('../models/Listing');
const User = require('../models/User');
const asyncHandler = require('../middlewares/async');
const searchService = require('../services/searchService');

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
// @desc    Get all listings
// @route   GET /api/listings
// @access  Public
exports.getListings = asyncHandler(async (req, res, next) => {
    // Search using Atlas Search (with Mongoose Aggregation fallback)
    const results = await searchService.searchProperties(req.query);
    let listings = results.data;

    // Attach distance if coordinates were provided
    if (req.query.lat && req.query.lng) {
        const userLat = parseFloat(req.query.lat);
        const userLng = parseFloat(req.query.lng);
        listings = listings.map(listing => {
            if (listing.geoSpatialLocation && listing.geoSpatialLocation.coordinates) {
                const [lng, lat] = listing.geoSpatialLocation.coordinates;
                listing.distance = getDistanceInKm(userLat, userLng, lat, lng);
            }
            return listing;
        });
    }

    // Build pagination links for compatibility with old interface
    const page = results.currentPage;
    const limit = results.limit;
    const total = results.total;
    const endIndex = page * limit;
    const startIndex = (page - 1) * limit;

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
        totalPages: results.totalPages,
        currentPage: page,
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

    const results = await searchService.getSearchSuggestions(q);
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

    const owner = listing.createdBy;
    const ownerInactive =
        listing.status !== 'Active' ||
        !owner ||
        (owner.accountStatus && owner.accountStatus !== 'Active');

    if (ownerInactive && req.user?.role !== 'Admin') {
        return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    // Check for associated Boundary Map
    const MapConfig = require('../models/MapConfig');
    const mapConfig = await MapConfig.findOne({ listingId: listing._id });

    res.status(200).json({ 
        success: true, 
        data: {
            ...listing.toObject(),
            mapConfig: mapConfig ? {
                shareId: mapConfig.shareId,
                thumbnail: mapConfig.thumbnail,
                polygonsCount: mapConfig.polygons?.length
            } : null
        }
    });
});

// @desc    Get current user's own listings (secure — uses token identity, not query param)
// @route   GET /api/listings/mine
// @access  Private (Seller/Broker/Admin)
exports.getMyListings = asyncHandler(async (req, res, next) => {
    const listings = await Listing.find({ createdBy: req.user.id })
        .sort('-createdAt')
        .populate('createdBy', 'name email phone role')
        .lean();

    res.status(200).json({
        success: true,
        count: listings.length,
        data: listings
    });
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
    
    // Set Owner vs Broker type based on user role
    req.body.ownerType = req.user.role === 'Broker' ? 'Broker' : 'Owner';
    
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

    // Prevent modifying core fields
    delete req.body._id;
    delete req.body.createdBy;

    // Update listing fields
    Object.assign(listing, req.body);

    await listing.save();

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
    const user = await User.findById(req.params.id).select('name role email phone createdAt accountStatus');
    
    if (!user) {
        return res.status(404).json({ success: false, error: 'Seller not found' });
    }

    if (user.accountStatus && user.accountStatus !== 'Active') {
        return res.status(404).json({ success: false, error: 'Seller not found' });
    }

    const allListings = await Listing.find({ createdBy: req.params.id, status: 'Active' })
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
