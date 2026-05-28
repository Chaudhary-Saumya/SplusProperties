const mongoose = require('mongoose');
const slugify = require('slugify');

const listingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    slug: {
        type: String,
        unique: true
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
    locationMode: {
        type: String,
        enum: ['address', 'map'],
        default: 'address'
    },
    plotNumber: {
        type: String,
        trim: true
    },
    areaName: {
        type: String,
        trim: true
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
    propertyType: {
        type: String,
        enum: ['Plot', 'Land'],
        default: 'Plot'
    },
    plotType: {
        type: String,
        enum: ['Residential', 'Commercial', 'Industrial', 'Agricultural', 'Other', 'None'],
        default: 'None'
    },
    landType: {
        type: String,
        enum: ['Agricultural', 'Non-Agricultural', 'Industrial', 'Commercial', 'Other', 'None'],
        default: 'None'
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    roadTouch: {
        type: Boolean,
        default: false
    },
    cornerPlot: {
        type: Boolean,
        default: false
    },
    isAgricultural: {
        type: Boolean,
        default: false
    },
    ownerType: {
        type: String,
        enum: ['Owner', 'Broker'],
        default: 'Owner'
    },
    city: {
        type: String,
        trim: true,
        default: ''
    },
    locality: {
        type: String,
        trim: true,
        default: ''
    },
    numericArea: {
        type: Number,
        default: 0
    }
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
listingSchema.index({ city: 1, locality: 1 });
listingSchema.index({ propertyType: 1, plotType: 1, landType: 1 });
listingSchema.index({ price: 1, numericArea: 1 });

// Generate slug and extract numeric area before saving
listingSchema.pre('save', async function() {
    // Slug generation
    if (this.isModified('title')) {
        const baseSlug = slugify(this.title, { lower: true, strict: true });
        const uniqueId = Math.random().toString(36).substring(2, 6);
        this.slug = `${baseSlug}-${uniqueId}`;
    }

    // Numeric area parsing (e.g. "500 Sq Ft" -> 500)
    if (this.isModified('area') || this.isNew) {
        if (this.area) {
            const match = this.area.match(/([\d.,]+)/);
            if (match) {
                // Remove commas and parse
                this.numericArea = parseFloat(match[1].replace(/,/g, '')) || 0;
            } else {
                this.numericArea = 0;
            }
        } else {
            this.numericArea = 0;
        }
    }
});

module.exports = mongoose.model('Listing', listingSchema);

