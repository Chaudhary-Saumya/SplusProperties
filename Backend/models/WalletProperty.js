const mongoose = require('mongoose');

const shareTokenSchema = new mongoose.Schema({
    token: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    viewCount: { type: Number, default: 0 },
    label: { type: String, default: '' } // Optional label like "Sent to Ramesh"
});

const walletPropertySchema = new mongoose.Schema({
    // ── Owner (Broker) ──
    brokerId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Broker ID is required'],
        index: true
    },

    // ── Core Details (flexible, minimal validation) ──
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [150, 'Title cannot exceed 150 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    price: {
        type: Number,
        min: 0
    },
    priceLabel: {
        type: String,
        trim: true,
        maxlength: [100, 'Price label too long']
    },
    area: {
        type: String,
        trim: true
    },
    areaValue: {
        type: Number,
        min: 0
    },
    areaUnit: {
        type: String,
        trim: true,
        default: 'vigha_bada'
    },

    // ── Location (searchable) ──
    location: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        trim: true,
        index: true
    },
    locality: {
        type: String,
        trim: true
    },

    // ── Property Details ──
    propertyType: {
        type: String,
        enum: ['Plot', 'Land', 'Other'],
        default: 'Land'
    },
    landType: {
        type: String,
        enum: ['Agricultural', 'Non-Agricultural', 'Industrial', 'Commercial', 'Residential', 'Other', ''],
        default: ''
    },
    ownerName: {
        type: String,
        trim: true
    },
    ownerPhone: {
        type: String,
        trim: true
    },

    // ── Media (optional — unlike Listing which requires 1+) ──
    images: {
        type: [String],
        validate: [v => v.length <= 10, 'Cannot have more than 10 images']
    },

    // ── Broker's Private Notes ──
    notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },

    // ── Custom Tags ──
    tags: {
        type: [String],
        validate: [v => v.length <= 15, 'Cannot have more than 15 tags']
    },

    // ── Listing Link ──
    publishedListingId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Listing'
    },
    isPublished: {
        type: Boolean,
        default: false
    },

    // ── Sharing ──
    shareTokens: [shareTokenSchema]
}, {
    timestamps: true
});

// Compound indexes for fast broker-scoped searches
walletPropertySchema.index({ brokerId: 1, createdAt: -1 });
walletPropertySchema.index({ brokerId: 1, city: 1 });
walletPropertySchema.index({ brokerId: 1, isPublished: 1 });
walletPropertySchema.index(
    { title: 'text', location: 'text', city: 'text', locality: 'text', ownerName: 'text', notes: 'text', tags: 'text' },
    {
        weights: { title: 10, city: 8, location: 5, locality: 5, ownerName: 3, tags: 3, notes: 1 },
        name: 'WalletSearchTextIndex'
    }
);

module.exports = mongoose.model('WalletProperty', walletPropertySchema);
