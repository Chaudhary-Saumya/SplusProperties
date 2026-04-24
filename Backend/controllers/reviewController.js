const asyncHandler = require('../middlewares/async');
const ErrorResponse = require('../utils/errorResponse');
const Listing = require('../models/Listing');
const Review = require('../models/Review');

// @desc    Get reviews for a listing
// @route   GET /api/listings/:id/reviews
// @access  Public
const getReviews = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    return res.status(404).json({
      success: false,
      message: 'Listing not found'
    });
  }

  const reviews = await Review.find({ listing: req.params.id })
    .populate('user', 'name avatar role')
    .sort({ createdAt: -1 });

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length 
    : 0;

  res.status(200).json({
    success: true,
    count: reviews.length,
    averageRating: parseFloat(averageRating.toFixed(1)),
    reviews
  });
});

// @desc    Add review to listing
// @route   POST /api/listings/:id/reviews
// @access  Private
const addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const listingId = req.params.id;
  const userId = req.user.id;

  // Check if listing exists
  const listing = await Listing.findById(listingId);
  if (!listing) {
    return res.status(404).json({
      success: false,
      message: 'Listing not found'
    });
  }

  // Check if user already reviewed this listing
  const alreadyReviewed = await Review.findOne({ listing: listingId, user: userId });
  if (alreadyReviewed) {
    return res.status(400).json({
      success: false,
      message: 'You have already reviewed this listing'
    });
  }

  // Create review
  const review = await Review.create({
    listing: listingId,
    user: userId,
    rating,
    comment
  });

  // Add review to listing
  listing.reviews.push(review._id);
  await listing.save();

  // Populate review
  await review.populate('user', 'name avatar role');

  res.status(201).json({
    success: true,
    review
  });
});

module.exports = {
  getReviews,
  addReview
};

