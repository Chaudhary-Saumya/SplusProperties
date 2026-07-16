const Listing = require('../models/Listing');
const User = require('../models/User');
const Setting = require('../models/Setting');

// Fallback default weights in case settings are missing
const DEFAULT_WEIGHTS = {
    viewsWeight: 1.0,
    uniqueViewsWeight: 1.5,
    whatsappClicksWeight: 3.0,
    phoneClicksWeight: 4.0,
    favoritesWeight: 5.0,
    sharesWeight: 2.0,
    freshnessWeight: 10.0,
    trustWeight: 8.0,
    qualityWeight: 12.0,
    premiumBoost: 20.0,
    featuredBoost: 15.0,
    duplicatePenalty: -30.0,
    spamPenalty: -50.0,
    decayRate: 0.05
};

/**
 * Calculates listing completeness percentage and quality score (0 - 100)
 */
const calculateListingQualityScore = (listing) => {
    let score = 0;
    let totalFields = 0;
    let filledFields = 0;

    // Field completion checklist
    const checkFields = ['title', 'description', 'price', 'area', 'location', 'city', 'locality', 'propertyType'];
    checkFields.forEach(field => {
        totalFields++;
        if (listing[field]) filledFields++;
    });

    // Coordinates check
    totalFields++;
    if (listing.mapCoordinates && listing.mapCoordinates.lat && listing.mapCoordinates.lng) {
        filledFields++;
        score += 15; // Map accuracy points
    }

    // Images check
    totalFields++;
    const imageCount = listing.images?.length || 0;
    if (imageCount > 0) {
        filledFields++;
        score += Math.min(imageCount * 6, 30); // Max 30 points for 5+ images
    }

    // Video check
    totalFields++;
    if (listing.videos && listing.videos.length > 0) {
        filledFields++;
        score += 15; // Video presence
    }

    // Documents check
    totalFields++;
    if (listing.documents && listing.documents.length > 0) {
        filledFields++;
        score += 15; // Verified legal docs
    }

    // Description detail check
    const descLen = listing.description?.length || 0;
    if (descLen > 300) {
        score += 15;
    } else if (descLen > 100) {
        score += 8;
    }

    // Verified category boost
    if (listing.listingType === 'Verified') {
        score += 10;
    }

    const completionPercentage = Math.round((filledFields / totalFields) * 100);
    const qualityScore = Math.min(Math.max(score, 0), 100);

    return { qualityScore, completionPercentage };
};

/**
 * Calculates user/seller trust score (0 - 100)
 */
const calculateUserTrustScore = (user) => {
    if (!user) return 30; // Lowest score for unresolvable user

    let score = 40; // Base score for basic account

    if (user.role === 'Admin') score += 40;
    if (user.isVerified) score += 10;
    if (user.identityVerified) score += 15;
    if (user.documentVerified) score += 15;

    // Response time rating
    if (user.responseTime <= 30) score += 10;
    else if (user.responseTime <= 120) score += 5;

    // Completed deals scaling
    const dealBonus = Math.min((user.completedDeals || 0) * 2, 10);
    score += dealBonus;

    // Rating multiplier
    const ratingBonus = Math.round((user.ratingsAverage || 4) * 2);
    score += ratingBonus;

    return Math.min(Math.max(score, 0), 100);
};

/**
 * Calculates ranking score based on weighted parameters
 */
const calculateListingRankingScore = (listing, creatorScore, weights = DEFAULT_WEIGHTS) => {
    const now = new Date();
    const createdDate = new Date(listing.createdAt || now);
    const ageInDays = Math.max((now - createdDate) / (1000 * 60 * 60 * 24), 0);

    // 1. Freshness Decay
    const freshness = Math.max(0, 1 - (ageInDays / 30));
    const freshnessScore = freshness * weights.freshnessWeight;

    // 2. Dynamic Engagement Accumulation
    const views = listing.views || 0;
    const uniqueViews = listing.uniqueViews || 0;
    const whatsapp = listing.whatsappClicks || 0;
    const phone = listing.phoneClicks || 0;
    const favorites = listing.favoritesCount || 0;
    const shares = listing.shares || 0;

    const baseEngagement = (views * weights.viewsWeight) +
        (uniqueViews * weights.uniqueViewsWeight) +
        (whatsapp * weights.whatsappClicksWeight) +
        (phone * weights.phoneClicksWeight) +
        (favorites * weights.favoritesWeight) +
        (shares * weights.sharesWeight);

    // 3. Time decay for older listings
    const decayFactor = 1 / (1 + (weights.decayRate * ageInDays));
    const engagementScore = baseEngagement * decayFactor;

    // 4. Quality & Creator Trust scores
    const qualityPart = (listing.qualityScore / 100) * weights.qualityWeight;
    const trustPart = (creatorScore / 100) * weights.trustWeight;

    // 5. Featured / Premium Boosts
    let boost = 0;
    if (listing.isFeatured) boost += weights.featuredBoost;
    if (listing.listingType === 'Verified') boost += weights.featuredBoost * 0.5;

    // 6. Anti-Spam Penalties
    let penalty = 0;
    if (listing.isDuplicate) penalty += weights.duplicatePenalty;
    if (listing.spamReports > 0) {
        penalty += weights.spamPenalty * Math.min(listing.spamReports, 3);
    }

    // 7. Final Combined Ranking score
    const rankingScore = Math.round((qualityPart * 10) + engagementScore + freshnessScore + (trustPart * 10) + boost + penalty);

    // 8. Velocity-based Trending score (focuses on recent interaction weight)
    const lastActive = new Date(listing.lastInteractionAt || now);
    const lastActiveDiffDays = Math.max((now - lastActive) / (1000 * 60 * 60 * 24), 0);
    const recencyWeight = 1 / (1 + (0.1 * lastActiveDiffDays));
    const trendingScore = Math.round(baseEngagement * recencyWeight);

    return {
        rankingScore,
        freshnessScore: Math.round(freshnessScore),
        engagementScore: Math.round(engagementScore),
        trendingScore
    };
};

/**
 * Iterates over listings, performs duplicate checks, calculations, and saves score state.
 */
const updateAllScores = async () => {
    try {
        console.log('Running batch ranking score calculations...');
        
        // Fetch Admin configuration weights
        const settingObj = await Setting.findOne({ key: 'ranking_weights' });
        const weights = settingObj?.value || DEFAULT_WEIGHTS;

        const listings = await Listing.find({ status: 'Active' });
        console.log(`Found ${listings.length} active listings to recalculate.`);

        // Step 1: Run duplicate matching in memory to apply penalties
        const titleMap = new Map();
        listings.forEach(listing => {
            const cleanTitle = listing.title.toLowerCase().trim();
            if (titleMap.has(cleanTitle)) {
                titleMap.get(cleanTitle).push(listing);
            } else {
                titleMap.set(cleanTitle, [listing]);
            }
        });

        // Apply duplicate status
        for (const [title, list] of titleMap.entries()) {
            if (list.length > 1) {
                // Keep the oldest one as main, mark rest as duplicates
                list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                for (let i = 1; i < list.length; i++) {
                    list[i].isDuplicate = true;
                }
            } else {
                list[0].isDuplicate = false;
            }
        }

        let updatedCount = 0;

        // Step 2: Compute scores for each listing
        for (const listing of listings) {
            const user = await User.findById(listing.createdBy);
            const trustScore = calculateUserTrustScore(user);
            
            // Save trust score back to User model
            if (user && user.trustScore !== trustScore) {
                user.trustScore = trustScore;
                await user.save();
            }

            const { qualityScore, completionPercentage } = calculateListingQualityScore(listing);
            listing.qualityScore = qualityScore;
            listing.completionPercentage = completionPercentage;

            const scores = calculateListingRankingScore(listing, trustScore, weights);
            Object.assign(listing, scores);

            await listing.save();
            updatedCount++;
        }

        console.log(`Successfully completed ranking calculations for ${updatedCount} properties.`);
        return { success: true, count: updatedCount };
    } catch (err) {
        console.error('Failed to run batch ranking calculations:', err);
        return { success: false, error: err.message };
    }
};

module.exports = {
    calculateListingQualityScore,
    calculateUserTrustScore,
    calculateListingRankingScore,
    updateAllScores
};
