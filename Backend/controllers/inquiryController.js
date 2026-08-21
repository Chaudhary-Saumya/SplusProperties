const Inquiry = require('../models/Inquiry');
const Listing = require('../models/Listing');
const User = require('../models/User');
const asyncHandler = require('../middlewares/async');
const { isUserAccountActive } = require('../utils/userCleanup');

// @desc    Create an inquiry or site visit request
// @route   POST /api/inquiries
// @access  Private (Buyer)
exports.createInquiry = asyncHandler(async (req, res, next) => {
    req.body.userId = req.user.id;

    const listing = await Listing.findById(req.body.listingId);
    if (!listing) {
        return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    if (listing.status !== 'Active') {
        return res.status(403).json({
            success: false,
            error: 'This property is not available for inquiries right now.'
        });
    }

    const seller = await User.findById(listing.createdBy).select('accountStatus role');
    if (!seller || !isUserAccountActive(seller)) {
        return res.status(403).json({
            success: false,
            error: 'Seller is unavailable. You cannot send an inquiry for this property.'
        });
    }

    // Rate limit: max 3 inquiries per user per listing
    const inquiryCount = await Inquiry.countDocuments({
        userId: req.user.id,
        listingId: req.body.listingId
    });
    if (inquiryCount >= 3) {
        return res.status(429).json({ 
            success: false, 
            error: `Max 3 contact requests allowed per property. You have already sent ${inquiryCount}. Please wait for seller response.` 
        });
    }

    const inquiry = await Inquiry.create(req.body);

    // Increment Contact Count + Inquiries counter for ranking engagement
    await Listing.findByIdAndUpdate(req.body.listingId, {
        $inc: { contacts: 1, inquiries: 1 },
        $set: { lastInteractionAt: Date.now() }
    });

    // Log engagement activity for ranking + recommendation
    const UserActivity = require('../models/UserActivity');
    await UserActivity.create({
        userId: req.user.id,
        actionType: 'ENQUIRY',
        actionDetails: { listingId: req.body.listingId }
    });

    const io = req.app.get('io');
    if (io) {
        io.to(listing.createdBy.toString()).emit('new_inquiry', {
            inquiry,
            listingTitle: listing.title
        });
    }

    res.status(201).json({ success: true, data: inquiry });
});

// @desc    Get all inquiries for User or Admin
// @route   GET /api/inquiries
// @access  Private
exports.getInquiries = asyncHandler(async (req, res, next) => {
    let query;

    if (req.user.role === 'Admin') {
        query = Inquiry.find()
            .populate({
                path: 'listingId',
                populate: { path: 'createdBy', select: 'name role' }
            })
            .populate('userId', 'name email phone');
    } else {
        // For Buyer, Seller, or Broker:
        // 1. Get inquiries they SENT
        // 2. If they are Seller/Broker, also get inquiries RECEIVED on their own listings
        
        let listingIds = [];
        if (req.user.role === 'Seller' || req.user.role === 'Broker') {
            const myListings = await Listing.find({ createdBy: req.user.id }).select('_id');
            listingIds = myListings.map(l => l._id);
        }

        query = Inquiry.find({
            $or: [
                { userId: req.user.id },
                { listingId: { $in: listingIds } }
            ]
        })
        .populate({
            path: 'listingId',
            select: 'title price location images createdBy',
            populate: { path: 'createdBy', select: 'name role email phone' }
        })
        .populate('userId', 'name email phone role');
    }

    const inquiries = await query.sort('-createdAt');

    res.status(200).json({ success: true, count: inquiries.length, data: inquiries });
});

// @desc    Update inquiry status
// @route   PATCH /api/inquiries/:id/status
// @access  Private (Seller/Broker/Admin)
exports.updateInquiryStatus = asyncHandler(async (req, res, next) => {
    const allowedStatuses = ['Pending', 'Contacted', 'Resolved'];
    if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({ success: false, error: 'Invalid inquiry status' });
    }

    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ success: false, error: 'Inquiry not found' });

    if (req.user.role !== 'Admin') {
        const listing = await Listing.findById(inquiry.listingId).select('createdBy');
        if (!listing || listing.createdBy.toString() !== req.user.id.toString()) {
            return res.status(403).json({ success: false, error: 'Not authorized to update this inquiry' });
        }
    }

    inquiry.status = req.body.status;
    await inquiry.save();
    
    const io = req.app.get('io');
    if (io) {
        io.to(inquiry.userId.toString()).emit('inquiry_status_updated', {
            inquiryId: inquiry._id,
            status: inquiry.status
        });
    }
    
    res.status(200).json({ success: true, data: inquiry });
});

// @desc    Track buyer interaction lead (WhatsApp or Call click)
// @route   POST /api/inquiries/track-lead
// @access  Public / Optional Auth
exports.trackLead = asyncHandler(async (req, res, next) => {
    const { listingId, leadType, buyerName, buyerPhone } = req.body;

    const listing = await Listing.findById(listingId);
    if (!listing) {
        return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    const Lead = require('../models/Lead');
    const lead = await Lead.create({
        listingId,
        sellerId: listing.createdBy,
        buyerId: req.user ? req.user.id : null,
        buyerName: buyerName || (req.user ? req.user.name : 'Interested Visitor'),
        buyerPhone: buyerPhone || (req.user ? req.user.phone : 'Direct Click'),
        leadType: leadType || 'WhatsApp'
    });

    // Increment contacts counter on listing
    await Listing.findByIdAndUpdate(listingId, {
        $inc: { contacts: 1 },
        $set: { lastInteractionAt: Date.now() }
    });

    res.status(201).json({ success: true, data: lead });
});

// @desc    Get buyer leads for Seller / Broker
// @route   GET /api/inquiries/seller-leads
// @access  Private (Seller/Broker/Admin)
exports.getSellerLeads = asyncHandler(async (req, res, next) => {
    const Lead = require('../models/Lead');
    const leads = await Lead.find({ sellerId: req.user.id })
        .populate('listingId', 'title price location images landType plotType')
        .sort('-createdAt')
        .limit(100);

    res.status(200).json({ success: true, count: leads.length, data: leads });
});

