const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.ObjectId, 
        ref: 'User',
        required: false // Allow anonymous sessions initially
    },
    sessionId: { 
        type: String,
        required: false // Used as fallback identity hook for non-logged-in users
    }, 
    actionType: { 
        type: String, 
        enum: ['SEARCH', 'VIEW', 'CONTACT', 'FAVORITE'], 
        required: true 
    },
    actionDetails: {
        listingId: { type: mongoose.Schema.ObjectId, ref: 'Listing' },
        searchTerm: { type: String },
        filters: mongoose.Schema.Types.Mixed
    },
    metadata: {
        duration: Number // Approximate dwell time tracking
    }
}, { timestamps: true });

// Advanced Indexes for Performance & Data Archival

// Analytics: Fast aggregations by User behavior flows
userActivitySchema.index({ userId: 1, actionType: 1 });

// TTL Archival: System will natively and silently purge interaction data older than 90 days to prevent server database bloat.
userActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('UserActivity', userActivitySchema);
