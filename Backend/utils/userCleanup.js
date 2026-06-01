const Listing = require('../models/Listing');
const Inquiry = require('../models/Inquiry');
const Review = require('../models/Review');
const Session = require('../models/Session');
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const UserActivity = require('../models/UserActivity');
const MapConfig = require('../models/MapConfig');
const User = require('../models/User');

/**
 * Hide or restore a seller/broker's listings on public site.
 */
exports.setUserListingsVisibility = async (userId, makeActive) => {
    const status = makeActive ? 'Active' : 'Inactive';
    await Listing.updateMany({ createdBy: userId }, { status });
};

/** Revoke all login sessions for a user. */
exports.revokeUserSessions = async (userId) => {
    await Session.deleteMany({ userId });
};

/**
 * Permanently remove user and all related data (listings, inquiries, reviews, etc.).
 */
exports.deleteUserAndRelatedData = async (userId) => {
    const listingIds = await Listing.find({ createdBy: userId }).distinct('_id');

    if (listingIds.length > 0) {
        await Inquiry.deleteMany({
            $or: [{ listingId: { $in: listingIds } }, { userId }]
        });
        await Review.deleteMany({
            $or: [{ listing: { $in: listingIds } }, { user: userId }]
        });
        await MapConfig.deleteMany({
            $or: [{ listingId: { $in: listingIds } }, { createdBy: userId }]
        });
        await Listing.deleteMany({ _id: { $in: listingIds } });
    } else {
        await Inquiry.deleteMany({ userId });
        await Review.deleteMany({ user: userId });
        await MapConfig.deleteMany({ createdBy: userId });
    }

    await Transaction.deleteMany({
        $or: [{ buyerId: userId }, { sellerId: userId }]
    });
    await Payment.deleteMany({ buyerId: userId });
    await UserActivity.deleteMany({ userId });
    await Session.deleteMany({ userId });

    // Remove deleted user's listings from everyone else's favorites
    if (listingIds.length > 0) {
        await User.updateMany(
            { favorites: { $in: listingIds } },
            { $pull: { favorites: { $in: listingIds } } }
        );
    }

    await User.findByIdAndDelete(userId);

    return { deletedListings: listingIds.length };
};

/** Returns true if user can own visible listings / receive inquiries. */
exports.isUserAccountActive = (user) => {
    if (!user) return false;
    return !user.accountStatus || user.accountStatus === 'Active';
};
