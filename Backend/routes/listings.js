const express = require('express');
const {
    getListings,
    getListing,
    createListing,
    updateListing,
    deleteListing,
    requestVerification,
    verifyListing,
    rejectVerification,
    reserveListing,
    recordView,
    getSearchSuggestions,
    getNearbyListings,
    getMyTokenedListings,
    getMyListings,
    getSellerProfile
} = require('../controllers/listingController');

const { getReviews, addReview } = require('../controllers/reviewController');

const { check } = require('express-validator');
const validate = require('../middlewares/validator');
const { protect, authorize, requireCompleteProfile } = require('../middlewares/auth');

const router = express.Router();

router.get('/my/tokened', protect, getMyTokenedListings);
router.get('/mine', protect, authorize('Seller', 'Broker', 'Admin'), getMyListings);

router.route('/')
    .get(getListings)
    .post([
        protect, 
        requireCompleteProfile,
        authorize('Seller', 'Broker', 'Admin'),
        check('title', 'Title is required').not().isEmpty(),
        check('description', 'Description is required').not().isEmpty(),
        check('price', 'Price must be a number').isNumeric(),
        check('area', 'Area is required').not().isEmpty(),
        check('location', 'Location is required').not().isEmpty(),
        validate
    ], createListing);

router.get('/search/suggestions', getSearchSuggestions);
router.get('/nearby', getNearbyListings);
router.get('/seller/:id', getSellerProfile);

router.route('/:id')
    .get(getListing)
    .put(protect, requireCompleteProfile, authorize('Seller', 'Broker', 'Admin'), updateListing)
    .delete(protect, authorize('Seller', 'Broker', 'Admin'), deleteListing);

router.route('/:id/view').post(recordView);

router.route('/:id/request-verification')
    .patch(protect, requireCompleteProfile, authorize('Seller', 'Broker', 'Admin'), requestVerification);

router.route('/:id/verify')
    .patch(protect, authorize('Admin'), verifyListing);

router.route('/:id/reject-verification')
    .patch(protect, authorize('Admin'), rejectVerification);

router.route('/:id/reserve')
    .patch(protect, authorize('Admin'), reserveListing); // Prefer payment flow; admin fallback only

router.route('/:id/reviews')
    .get(getReviews)
    .post(protect, requireCompleteProfile, addReview);

module.exports = router;
