const mongoose = require('mongoose');

const pageHitSchema = new mongoose.Schema({
    path: {
        type: String,
        required: true
    },
    date: {
        type: String, // Format: YYYY-MM-DD
        required: true
    },
    hits: {
        type: Number,
        default: 1
    }
});

module.exports = mongoose.model('PageHit', pageHitSchema);
