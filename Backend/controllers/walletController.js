const mongoose = require('mongoose');
const WalletProperty = require('../models/WalletProperty');
const asyncHandler = require('../middlewares/async');
const crypto = require('crypto');

const MAX_WALLET_PROPERTIES = 200; // Per broker limit
const SHARE_TOKEN_EXPIRY_DAYS = 7;

// ─── Helper: Verify ownership ───
const verifyOwnership = async (propertyId, userId) => {
    const property = await WalletProperty.findById(propertyId);
    if (!property) return { error: 'Property not found', status: 404 };
    if (property.brokerId.toString() !== userId.toString()) {
        return { error: 'Not authorized to access this property', status: 403 };
    }
    return { property };
};

// @desc    Get all wallet properties for the current broker (with search/filter)
// @route   GET /api/wallet
// @access  Private (Broker only)
exports.getWalletProperties = asyncHandler(async (req, res) => {
    const query = { brokerId: req.user.id };

    // ── Full-text search ──
    if (req.query.q && req.query.q.trim().length >= 2) {
        const searchTerm = req.query.q.trim();
        query.$or = [
            { title: { $regex: searchTerm, $options: 'i' } },
            { location: { $regex: searchTerm, $options: 'i' } },
            { city: { $regex: searchTerm, $options: 'i' } },
            { locality: { $regex: searchTerm, $options: 'i' } },
            { ownerName: { $regex: searchTerm, $options: 'i' } },
            { tags: { $regex: searchTerm, $options: 'i' } },
            { notes: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } }
        ];
    }

    // ── Filters ──
    if (req.query.city) query.city = { $regex: req.query.city, $options: 'i' };
    if (req.query.propertyType) query.propertyType = req.query.propertyType;
    if (req.query.landType) query.landType = req.query.landType;
    if (req.query.published === 'true') query.isPublished = true;
    if (req.query.published === 'false') query.isPublished = false;

    // ── Price range ──
    if (req.query.minPrice || req.query.maxPrice) {
        query.price = {};
        if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
        if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
    }

    // ── Tags filter ──
    if (req.query.tag) {
        query.tags = { $regex: req.query.tag, $options: 'i' };
    }

    // ── Pagination ──
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    // ── Sort ──
    let sortObj = { createdAt: -1 }; // Default: newest first
    if (req.query.sort === 'price_asc') sortObj = { price: 1 };
    if (req.query.sort === 'price_desc') sortObj = { price: -1 };
    if (req.query.sort === 'title') sortObj = { title: 1 };
    if (req.query.sort === 'oldest') sortObj = { createdAt: 1 };

    const [properties, total] = await Promise.all([
        WalletProperty.find(query)
            .sort(sortObj)
            .skip(skip)
            .limit(limit)
            .lean(),
        WalletProperty.countDocuments(query)
    ]);

    res.status(200).json({
        success: true,
        count: properties.length,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        data: properties
    });
});

// @desc    Get single wallet property
// @route   GET /api/wallet/:id
// @access  Private (Broker only, own)
exports.getWalletProperty = asyncHandler(async (req, res) => {
    const { property, error, status } = await verifyOwnership(req.params.id, req.user.id);
    if (error) return res.status(status).json({ success: false, error });

    res.status(200).json({ success: true, data: property });
});

// @desc    Add new wallet property
// @route   POST /api/wallet
// @access  Private (Broker only)
exports.addWalletProperty = asyncHandler(async (req, res) => {
    // Check broker's property limit
    const count = await WalletProperty.countDocuments({ brokerId: req.user.id });
    if (count >= MAX_WALLET_PROPERTIES) {
        return res.status(400).json({
            success: false,
            error: `You have reached the maximum limit of ${MAX_WALLET_PROPERTIES} wallet properties. Please remove unused properties to add new ones.`
        });
    }

    req.body.brokerId = req.user.id;

    // Sanitize: strip fields that shouldn't be set on creation
    delete req.body._id;
    delete req.body.publishedListingId;
    delete req.body.isPublished;
    delete req.body.shareTokens;

    const property = await WalletProperty.create(req.body);

    res.status(201).json({
        success: true,
        message: 'Property added to your wallet',
        data: property
    });
});

// @desc    Update wallet property
// @route   PUT /api/wallet/:id
// @access  Private (Broker only, own)
exports.updateWalletProperty = asyncHandler(async (req, res) => {
    const { property, error, status } = await verifyOwnership(req.params.id, req.user.id);
    if (error) return res.status(status).json({ success: false, error });

    // Prevent overwriting core fields
    delete req.body._id;
    delete req.body.brokerId;
    delete req.body.shareTokens;

    Object.assign(property, req.body);
    await property.save();

    res.status(200).json({
        success: true,
        message: 'Property updated',
        data: property
    });
});

// @desc    Delete wallet property
// @route   DELETE /api/wallet/:id
// @access  Private (Broker only, own)
exports.deleteWalletProperty = asyncHandler(async (req, res) => {
    const { property, error, status } = await verifyOwnership(req.params.id, req.user.id);
    if (error) return res.status(status).json({ success: false, error });

    await WalletProperty.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        message: 'Property removed from wallet',
        data: {}
    });
});

// @desc    Generate share link for a wallet property
// @route   POST /api/wallet/:id/share
// @access  Private (Broker only, own)
exports.generateShareLink = asyncHandler(async (req, res) => {
    const { property, error, status } = await verifyOwnership(req.params.id, req.user.id);
    if (error) return res.status(status).json({ success: false, error });

    // Max 5 active share tokens per property
    const activeTokens = property.shareTokens.filter(t => t.expiresAt > new Date());
    if (activeTokens.length >= 5) {
        return res.status(400).json({
            success: false,
            error: 'Maximum 5 active share links per property. Revoke an existing link first.'
        });
    }

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + SHARE_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    property.shareTokens.push({
        token,
        expiresAt,
        label: req.body.label || ''
    });

    await property.save();

    res.status(201).json({
        success: true,
        message: `Share link created (expires in ${SHARE_TOKEN_EXPIRY_DAYS} days)`,
        data: {
            token,
            expiresAt,
            shareUrl: `/p/share/${token}`
        }
    });
});

// @desc    Revoke a share link
// @route   DELETE /api/wallet/:id/share/:tokenId
// @access  Private (Broker only, own)
exports.revokeShareLink = asyncHandler(async (req, res) => {
    const { property, error, status } = await verifyOwnership(req.params.id, req.user.id);
    if (error) return res.status(status).json({ success: false, error });

    const tokenIndex = property.shareTokens.findIndex(
        t => t._id.toString() === req.params.tokenId
    );
    if (tokenIndex === -1) {
        return res.status(404).json({ success: false, error: 'Share link not found' });
    }

    property.shareTokens.splice(tokenIndex, 1);
    await property.save();

    res.status(200).json({
        success: true,
        message: 'Share link revoked',
        data: {}
    });
});

// @desc    View a shared property (public — token-authenticated)
// @route   GET /api/wallet/shared/:token
// @access  Public
exports.viewSharedProperty = asyncHandler(async (req, res) => {
    const { token } = req.params;

    // Find the property that contains this share token
    const property = await WalletProperty.findOne({
        'shareTokens.token': token
    }).populate('brokerId', 'name phone profileImage role').lean();

    if (!property) {
        return res.status(404).json({
            success: false,
            error: 'This share link is invalid or has expired.'
        });
    }

    // Find the specific token
    const shareToken = property.shareTokens.find(t => t.token === token);
    if (!shareToken || new Date(shareToken.expiresAt) < new Date()) {
        return res.status(410).json({
            success: false,
            error: 'This share link has expired. Please request a new link from the broker.'
        });
    }

    // Increment view count
    await WalletProperty.updateOne(
        { _id: property._id, 'shareTokens.token': token },
        { $inc: { 'shareTokens.$.viewCount': 1 } }
    );

    // Strip sensitive data: owner info, notes, other share tokens
    const sanitizedProperty = {
        _id: property._id,
        title: property.title,
        description: property.description,
        price: property.price,
        priceLabel: property.priceLabel,
        area: property.area,
        areaValue: property.areaValue,
        areaUnit: property.areaUnit,
        location: property.location,
        city: property.city,
        locality: property.locality,
        propertyType: property.propertyType,
        landType: property.landType,
        images: property.images,
        tags: property.tags,
        isPublished: property.isPublished,
        publishedListingId: property.publishedListingId,
        createdAt: property.createdAt,
        broker: {
            name: property.brokerId?.name,
            phone: property.brokerId?.phone,
            profileImage: property.brokerId?.profileImage,
            role: property.brokerId?.role
        }
    };

    res.status(200).json({
        success: true,
        data: sanitizedProperty
    });
});

// @desc    Get wallet stats/summary for current broker
// @route   GET /api/wallet/stats
// @access  Private (Broker only)
exports.getWalletStats = asyncHandler(async (req, res) => {
    const brokerId = req.user.id;
    let brokerObjectId;
    try {
        brokerObjectId = new mongoose.Types.ObjectId(brokerId);
    } catch {
        brokerObjectId = brokerId;
    }

    const [total, published, unpublished, cityCounts] = await Promise.all([
        WalletProperty.countDocuments({ brokerId }),
        WalletProperty.countDocuments({ brokerId, isPublished: true }),
        WalletProperty.countDocuments({ brokerId, isPublished: false }),
        WalletProperty.aggregate([
            { $match: { brokerId: brokerObjectId } },
            { $match: { city: { $exists: true, $ne: '' } } },
            { $group: { _id: { $toLower: '$city' }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]).catch(() => [])
    ]);

    res.status(200).json({
        success: true,
        data: {
            total,
            published,
            unpublished,
            remaining: Math.max(0, MAX_WALLET_PROPERTIES - total),
            topCities: (cityCounts || []).map(c => ({
                city: (c._id ? c._id.charAt(0).toUpperCase() + c._id.slice(1) : 'Unspecified'),
                count: c.count
            }))
        }
    });
});
