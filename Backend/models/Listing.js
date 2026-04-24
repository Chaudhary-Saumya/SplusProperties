const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxlength: [2000, 'Description cannot be more than 2000 characters']
    },
    price: {
        type: Number,
        required: [true, 'Please add a price']
    },
    area: {
        type: String,
        required: [true, 'Please add total plot area']
    },
    location: {
        type: String,
        required: [true, 'Please add a location string']
    },
    mapCoordinates: {
        lat: String,
        lng: String
    },
    geoSpatialLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // Required format: [longitude, latitude]
            default: [0, 0]
        }
    },
    images: {
        type: [String],
        validate: [v => v.length <= 10, 'Cannot upload more than 10 images']
    },
    documents: {
        type: [String], 
    },
    videos: {
        type: [String]
    },
    listingType: {
        type: String,
        enum: ['Basic', 'Verified'],
        default: 'Basic'
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    isBookingEnabled: {
        type: Boolean,
        default: false
    },
    tokenAmount: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    payoutAccountId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [function() { return this.isBookingEnabled; }, 'Please select a bank account to receive payments']
    },
    isTokened: {
        type: Boolean,
        default: false
    },
    tokenedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    tokenedAt: {
        type: Date
    },
    verifiedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    verifiedAt: {
        type: Date
    },
    views: {
        type: Number,
        default: 0
    },
    contacts: {
        type: Number,
        default: 0
    },
    favoritesCount: {
        type: Number,
        default: 0
    },
    reviews: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Review'
    }],
}, {
    timestamps: true

});

// Advanced Discovery & Performance Indexes
listingSchema.index({ geoSpatialLocation: '2dsphere' }); // Geo radius bounding queries
listingSchema.index(
    { title: 'text', location: 'text', description: 'text' }, // Smart Full-text engine
    { 
        weights: { title: 10, location: 5, description: 1 },
        name: "SmartSearchTextIndex"
    }
);
// General sort/filter indexes for optimal performance
listingSchema.index({ price: 1, status: 1 });
listingSchema.index({ listingType: 1 });
listingSchema.index({ createdBy: 1, status: 1 }); // Optimized for seller profiles
listingSchema.index({ createdAt: -1 }); // Optimized for recency sorting
listingSchema.index({ isVerified: 1 });
listingSchema.index({ isTokened: 1 });
listingSchema.index({ reviews: 1 });

module.exports = mongoose.model('Listing', listingSchema);

