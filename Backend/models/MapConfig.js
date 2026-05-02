const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const mapConfigSchema = new mongoose.Schema({
    title: {
        type: String,
        default: 'Untitled Map'
    },
    polygons: [{
        points: [{
            lat: Number,
            lng: Number
        }],
        color: {
            type: String,
            default: '#c9a84c'
        },
        label: {
            type: String,
            default: ''
        },
        area: {
            sqm: String,
            acres: String,
            sqft: String
        }
    }],
    center: {
        lat: Number,
        lng: Number
    },
    zoom: {
        type: Number,
        default: 18
    },
    tileMode: {
        type: String,
        enum: ['satellite', 'hybrid', 'road'],
        default: 'satellite'
    },
    shareId: {
        type: String,
        unique: true,
        default: () => uuidv4().split('-')[0] // Short unique ID
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: false
    },
    expiresAt: {
        type: Date,
        default: null
    },
    listingId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Listing'
    },
    thumbnail: {
        type: String, // Base64 image
        default: null
    }
}, { timestamps: true });

// TTL index to automatically delete guest maps after expiresAt time
mapConfigSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('MapConfig', mapConfigSchema);
