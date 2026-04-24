const Transaction = require('../models/Transaction');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { sendPaymentNotification } = require('../utils/notifications');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Helper to get Razorpay instance with latest environment variables
const getRazorpayInstance = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
};

// @desc    Create a payment order for tokening
// @route   POST /api/payments/create-order
// @access  Private
exports.createTokenOrder = async (req, res) => {
    try {
        const { listingId } = req.body;
        const buyerId = req.user.id;

        const listing = await Listing.findById(listingId).populate('createdBy');
        if (!listing) return res.status(404).json({ success: false, error: 'Listing not found' });

        if (!listing.isBookingEnabled) {
            return res.status(400).json({ success: false, error: 'Booking is not enabled for this property' });
        }

        if (listing.isTokened) {
            return res.status(400).json({ success: false, error: 'Property is already tokened' });
        }

        const seller = listing.createdBy;
        const payoutAccount = seller.paymentAccounts.id(listing.payoutAccountId);

        if (!payoutAccount) {
            return res.status(400).json({ success: false, error: 'Seller bank details missing or invalid' });
        }

        // Razorpay Order Logic
        const razorpay = getRazorpayInstance();
        
        // Debug: Log key being used (first 8 chars only for safety)
        console.log(`Using Razorpay Key: ${process.env.RAZORPAY_KEY_ID?.substring(0, 8)}...`);

        const options = {
            amount: Math.round(listing.tokenAmount * 100), // Razorpay expects amount in paise
            currency: 'INR',
            receipt: `rcpt_${listing._id.toString().substring(0, 10)}_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        const transaction = await Transaction.create({
            buyerId,
            sellerId: seller._id,
            listingId,
            payoutAccountId: payoutAccount._id,
            amount: listing.tokenAmount,
            gatewayOrderId: order.id,
            paymentGateway: 'Razorpay',
            status: 'Pending'
        });

        res.status(200).json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            key: process.env.RAZORPAY_KEY_ID, // Send key to frontend
            transactionId: transaction._id
        });

    } catch (error) {
        console.error('Razorpay Order Error:', error);
        
        // Handle specific Razorpay authentication errors
        if (error.statusCode === 401) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid Razorpay API keys. Please check your .env file.' 
            });
        }

        res.status(500).json({ success: false, error: error.message || 'Server error while creating payment order' });
    }
};

// @desc    Verify payment and trigger transfer logic
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const razorpay = getRazorpayInstance();

        // Verify Signature
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature !== expectedSign) {
            return res.status(400).json({ success: false, error: 'Invalid payment signature' });
        }

        const transaction = await Transaction.findOne({ gatewayOrderId: razorpay_order_id });
        if (!transaction) return res.status(404).json({ success: false, error: 'Transaction not found' });

        transaction.gatewayPaymentId = razorpay_payment_id;
        transaction.status = 'Captured';
        transaction.paymentDetails = req.body;
        await transaction.save();

        // Update Listing Status
        const listing = await Listing.findById(transaction.listingId);
        listing.isTokened = true;
        listing.tokenedBy = transaction.buyerId;
        listing.tokenedAt = Date.now();
        await listing.save();

        // Send Notifications & Receipts
        const buyer = await User.findById(transaction.buyerId);
        const seller = await User.findById(transaction.sellerId);
        await sendPaymentNotification(buyer, seller, listing, transaction);

        // Populate full data for receipt
        await transaction.populate([
            { path: 'buyerId', select: 'name email phone' },
            { path: 'sellerId', select: 'name email phone' },
            { path: 'listingId', select: 'title location images price tokenAmount' }
        ]);

        res.status(200).json({
            success: true,
            message: 'Payment verified and property tokened successfully',
            receiptNumber: transaction.receiptNumber,
            transaction: transaction,
            buyerName: transaction.buyerId.name,
            buyerEmail: transaction.buyerId.email,
            buyerPhone: transaction.buyerId.phone,
            sellerName: transaction.sellerId.name,
            sellerEmail: transaction.sellerId.email,
            sellerPhone: transaction.sellerId.phone,
            listingTitle: transaction.listingId.title,
            listingLocation: transaction.listingId.location,
            amount: transaction.amount,
            createdAt: transaction.createdAt,
            razorpayOrderId: transaction.gatewayOrderId,
            razorpayPaymentId: transaction.gatewayPaymentId
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get transactions for current user
// @route   GET /api/payments/transactions
// @access  Private
exports.getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({
            $or: [{ buyerId: req.user.id }, { sellerId: req.user.id }]
        })
        .populate('buyerId', 'name email phone')
        .populate('sellerId', 'name email phone')
        .populate('listingId', 'title location price images')
        .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: transactions.length,
            data: transactions
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
