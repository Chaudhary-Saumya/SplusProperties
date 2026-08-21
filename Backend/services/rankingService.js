const Listing = require('../models/Listing');
const User = require('../models/User');
const Setting = require('../models/Setting');
const { getDemandScoreForListing, refreshLocationDemandCache } = require('./locationDemandService');

// ═══════════════════════════════════════════════════════════════════════════════
//  S+ Properties — Production-Grade 6-Factor Ranking Engine
//  Weighted Formula: Freshness 25% | Quality 20% | Engagement 20%
//                    Verification 15% | Price Competitiveness 10% | Location Demand 10%
// ═══════════════════════════════════════════════════════════════════════════════

// Helper: replace NaN/undefined/Infinity with 0
const safeNum = (val) => (Number.isFinite(val) ? val : 0);

// Sigmoid decay function — smoother than linear, avoids harsh 30-day cliff
const sigmoid = (x, midpoint = 30, steepness = 0.15) => {
    return 1 / (1 + Math.exp(steepness * (x - midpoint)));
};

// Factor weights (must sum to 1.0)
const FACTOR_WEIGHTS = {
    freshness: 0.25,
    quality: 0.20,
    engagement: 0.20,
    verification: 0.15,
    priceCompetitiveness: 0.10,
    locationDemand: 0.10
};

// Engagement metric weights (internal to engagement factor)
const ENGAGEMENT_METRIC_WEIGHTS = {
    views: 1.0,
    uniqueViews: 2.0,
    whatsappClicks: 8.0,
    phoneClicks: 10.0,
    inquiries: 12.0,
    favoritesCount: 6.0,
    shares: 3.0
};

// Boost multipliers for featured tiers
const BOOST_MULTIPLIERS = {
    none: 1.0,
    silver: 1.15,
    gold: 1.30,
    platinum: 1.50
};

// Anti-spam penalty thresholds
const SPAM_CONFIG = {
    duplicatePenaltyFactor: 0.4,    // Duplicates get 40% of their score
    spamReportPenaltyPerReport: 0.15, // Each report reduces by 15%, max 3
    highBounceThreshold: 0.6,        // >60% bounce rate = penalty
    bouncePenaltyFactor: 0.8,        // 80% of score if high bounce
    velocityThreshold: 5,            // >5 listings/day = velocity penalty
    velocityPenaltyFactor: 0.7       // 70% of score for velocity-flagged
};

// ─── Factor 1: Freshness Score (0-100) ───────────────────────────────────────
const calculateFreshnessScore = (listing) => {
    const now = new Date();
    const createdDate = new Date(listing.createdAt || now);
    const updatedDate = new Date(listing.updatedAt || createdDate);
    const ageInDays = Math.max((now - createdDate) / (1000 * 60 * 60 * 24), 0);
    const daysSinceUpdate = Math.max((now - updatedDate) / (1000 * 60 * 60 * 24), 0);

    // Sigmoid decay over 60 days (not a harsh 30-day linear cliff)
    const ageFreshness = sigmoid(ageInDays, 30, 0.12) * 100;

    // Bonus for recently updated listings (recency boost up to +15)
    const updateBonus = daysSinceUpdate < 7 ? (7 - daysSinceUpdate) * 2.14 : 0;

    return safeNum(Math.min(ageFreshness + updateBonus, 100));
};

// ─── Factor 2: Quality Score (0-100) ─────────────────────────────────────────
const calculateQualityScore = (listing) => {
    let score = 0;
    let totalFields = 0;
    let filledFields = 0;

    // Core field completion
    const checkFields = ['title', 'description', 'price', 'area', 'location', 'city', 'locality', 'propertyType'];
    checkFields.forEach(field => {
        totalFields++;
        if (listing[field]) filledFields++;
    });

    // Coordinates — high value signal
    totalFields++;
    if (listing.mapCoordinates && listing.mapCoordinates.lat && listing.mapCoordinates.lng) {
        filledFields++;
        score += 12;
    }

    // Images — progressive scoring (more = better, capped)
    totalFields++;
    const imageCount = listing.images?.length || 0;
    if (imageCount > 0) {
        filledFields++;
        if (imageCount >= 5) score += 25;
        else if (imageCount >= 3) score += 18;
        else score += imageCount * 5;
    }

    // Video — strong quality signal
    totalFields++;
    if (listing.videos && listing.videos.length > 0) {
        filledFields++;
        score += 12;
    }

    // Documents — legal verification indicator
    totalFields++;
    if (listing.documents && listing.documents.length > 0) {
        filledFields++;
        score += 12;
    }

    // Description depth — content quality
    const descLen = listing.description?.length || 0;
    if (descLen > 500) score += 15;
    else if (descLen > 300) score += 12;
    else if (descLen > 100) score += 6;

    // Property-specific attributes filled
    if (listing.plotNumber) score += 3;
    if (listing.areaName) score += 3;
    if (listing.cornerPlot !== undefined) score += 2;
    if (listing.roadTouch !== undefined) score += 2;
    if (listing.gatedCommunity) score += 2;
    if (listing.boundaryWall) score += 2;

    // Field completion percentage contribution
    const completionBonus = totalFields > 0 ? (filledFields / totalFields) * 10 : 0;
    score += completionBonus;

    const completionPercentage = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
    const qualityScore = safeNum(Math.min(Math.max(Math.round(score), 0), 100));

    return { qualityScore, completionPercentage };
};

// ─── Factor 3: Engagement Score (0-100, z-score normalized) ──────────────────
const calculateEngagementScore = (listing, engagementStats) => {
    // Compute raw weighted engagement
    const rawScore =
        (listing.views || 0) * ENGAGEMENT_METRIC_WEIGHTS.views +
        (listing.uniqueViews || 0) * ENGAGEMENT_METRIC_WEIGHTS.uniqueViews +
        (listing.whatsappClicks || 0) * ENGAGEMENT_METRIC_WEIGHTS.whatsappClicks +
        (listing.phoneClicks || 0) * ENGAGEMENT_METRIC_WEIGHTS.phoneClicks +
        (listing.inquiries || 0) * ENGAGEMENT_METRIC_WEIGHTS.inquiries +
        (listing.favoritesCount || 0) * ENGAGEMENT_METRIC_WEIGHTS.favoritesCount +
        (listing.shares || 0) * ENGAGEMENT_METRIC_WEIGHTS.shares;

    // Z-score normalization using population stats
    if (!engagementStats || engagementStats.stdDev === 0) {
        // Fallback: simple proportion if no stats
        return safeNum(Math.min(rawScore, 100));
    }

    // z-score: how many standard deviations above mean
    const zScore = (rawScore - engagementStats.mean) / engagementStats.stdDev;

    // Convert z-score to 0-100 using clamped linear mapping
    // z-score of -2 = 0, z-score of +3 = 100
    const normalized = Math.round(((zScore + 2) / 5) * 100);
    return safeNum(Math.max(0, Math.min(normalized, 100)));
};

// ─── Factor 4: Verification & Trust Score (0-100) ────────────────────────────
const calculateVerificationScore = (listing, user) => {
    let score = 0;

    // Listing verification status (max 40 points)
    if (listing.listingType === 'Verified') score += 35;
    if (listing.documents && listing.documents.length > 0) score += 5;

    // Seller trust (max 60 points from user attributes)
    if (user) {
        if (user.isVerified) score += 10;
        if (user.identityVerified) score += 15;
        if (user.documentVerified) score += 10;
        if (user.role === 'Admin') score += 15;

        // Response time bonus
        if (user.responseTime <= 30) score += 5;
        else if (user.responseTime <= 120) score += 2;

        // Completed deals
        score += Math.min((user.completedDeals || 0) * 1.5, 8);

        // Ratings
        const ratingBonus = Math.round(((user.ratingsAverage || 3) - 2) * 3.5);
        score += Math.max(0, ratingBonus);
    } else {
        score += 10; // Minimal base score for unresolved users
    }

    return safeNum(Math.min(Math.round(score), 100));
};

// ─── Factor 5: Price Competitiveness (0-100) ─────────────────────────────────
const calculatePriceCompetitiveness = (listing, medianPriceMap) => {
    if (!listing.pricePerSqYd || listing.pricePerSqYd <= 0) return 50; // Neutral if no data

    const city = (listing.city || '').toLowerCase().trim();
    const propType = listing.propertyType || 'Plot';
    const key = `${city}|${propType}`;

    const median = medianPriceMap[key];
    if (!median || median <= 0) return 50; // Neutral if no comparable data

    // Ratio: how listing compares to median (lower = more competitive)
    const ratio = listing.pricePerSqYd / median;

    // Score mapping:
    // ratio 0.5 (50% below median) = 100
    // ratio 1.0 (at median)        = 60
    // ratio 1.5 (50% above median) = 20
    // ratio 2.0+ (100%+ above)     = 0
    let score;
    if (ratio <= 0.5) {
        score = 100;
    } else if (ratio <= 1.0) {
        score = 100 - ((ratio - 0.5) * 80); // 100 → 60
    } else if (ratio <= 2.0) {
        score = 60 - ((ratio - 1.0) * 60); // 60 → 0
    } else {
        score = 0;
    }

    return safeNum(Math.max(0, Math.min(Math.round(score), 100)));
};

// ─── Factor 6: Location Demand (0-100, pre-computed) ─────────────────────────
// This score is looked up from the demand cache, already 0-100
// See locationDemandService.js

// ─── Anti-Spam: Penalty Computation ──────────────────────────────────────────
const computeAntiSpamMultiplier = (listing) => {
    let multiplier = 1.0;

    // Duplicate penalty
    if (listing.isDuplicate) {
        multiplier *= SPAM_CONFIG.duplicatePenaltyFactor;
    }

    // Spam reports (exponential)
    if (listing.spamReports > 0) {
        const reports = Math.min(listing.spamReports, 3);
        multiplier *= Math.pow(1 - SPAM_CONFIG.spamReportPenaltyPerReport, reports);
    }

    // High bounce rate penalty
    const totalViews = listing.views || 0;
    if (totalViews > 5) { // Only apply after enough views
        const bounceRate = (listing.bounceCount || 0) / totalViews;
        if (bounceRate > SPAM_CONFIG.highBounceThreshold) {
            multiplier *= SPAM_CONFIG.bouncePenaltyFactor;
        }
    }

    // Seller listing velocity penalty
    if ((listing.sellerListingVelocity || 0) > SPAM_CONFIG.velocityThreshold) {
        multiplier *= SPAM_CONFIG.velocityPenaltyFactor;
    }

    return safeNum(Math.max(multiplier, 0.1)); // Never go below 10%
};

// ─── Boost Multiplier ────────────────────────────────────────────────────────
const computeBoostMultiplier = (listing) => {
    // Check if featured status is still active
    if (listing.featuredUntil && new Date(listing.featuredUntil) < new Date()) {
        return 1.0; // Expired
    }

    let multiplier = 1.0;

    // Boost tier
    const tier = listing.boostTier || 'none';
    multiplier *= (BOOST_MULTIPLIERS[tier] || 1.0);

    // Featured flag (legacy — for non-tiered featured)
    if (listing.isFeatured && tier === 'none') {
        multiplier *= 1.20;
    }

    return multiplier;
};

// ─── Trending Score (72h velocity-based) ─────────────────────────────────────
const calculateTrendingScore = (listing) => {
    const now = new Date();
    const lastActive = new Date(listing.lastInteractionAt || listing.createdAt || now);
    const hoursSinceActive = Math.max((now - lastActive) / (1000 * 60 * 60), 0);

    // 72-hour rolling window emphasis
    const recencyFactor = hoursSinceActive <= 72
        ? 1 - (hoursSinceActive / 72) * 0.5 // 1.0 → 0.5 over 72h
        : 0.5 / (1 + 0.02 * (hoursSinceActive - 72)); // Slow decay after 72h

    // Weighted recent engagement
    const recentEngagement =
        (listing.uniqueViews || 0) * 2 +
        (listing.whatsappClicks || 0) * 8 +
        (listing.phoneClicks || 0) * 10 +
        (listing.inquiries || 0) * 12 +
        (listing.favoritesCount || 0) * 6 +
        (listing.shares || 0) * 3;

    return safeNum(Math.round(recentEngagement * recencyFactor));
};

// ─── User Trust Score (kept for backward compatibility) ──────────────────────
const calculateUserTrustScore = (user) => {
    if (!user) return 30;

    let score = 40;
    if (user.role === 'Admin') score += 40;
    if (user.isVerified) score += 10;
    if (user.identityVerified) score += 15;
    if (user.documentVerified) score += 15;
    if (user.responseTime <= 30) score += 10;
    else if (user.responseTime <= 120) score += 5;
    score += Math.min((user.completedDeals || 0) * 2, 10);
    score += Math.round((user.ratingsAverage || 4) * 2);

    return Math.min(Math.max(score, 0), 100);
};

// ═════════════════════════════════════════════════════════════════════════════
//  Combined Ranking Score Computation
// ═════════════════════════════════════════════════════════════════════════════

const calculateListingRankingScore = (listing, user, engagementStats, medianPriceMap, demandMap) => {
    // Compute each factor (all 0-100)
    const freshnessScore = calculateFreshnessScore(listing);
    const { qualityScore, completionPercentage } = calculateQualityScore(listing);
    const engagementScore = calculateEngagementScore(listing, engagementStats);
    const verificationScore = calculateVerificationScore(listing, user);
    const priceCompetitivenessScore = calculatePriceCompetitiveness(listing, medianPriceMap);
    const locationDemandScore = getDemandScoreForListing(demandMap, listing);

    // Weighted combination (each factor 0-100, weights sum to 1.0)
    let rawScore =
        (freshnessScore * FACTOR_WEIGHTS.freshness) +
        (qualityScore * FACTOR_WEIGHTS.quality) +
        (engagementScore * FACTOR_WEIGHTS.engagement) +
        (verificationScore * FACTOR_WEIGHTS.verification) +
        (priceCompetitivenessScore * FACTOR_WEIGHTS.priceCompetitiveness) +
        (locationDemandScore * FACTOR_WEIGHTS.locationDemand);

    // Apply anti-spam multiplier
    const spamMultiplier = computeAntiSpamMultiplier(listing);
    rawScore *= spamMultiplier;

    // Apply boost multiplier
    const boostMultiplier = computeBoostMultiplier(listing);
    rawScore *= boostMultiplier;

    // Final ranking score: 0-100 scale (can exceed 100 with boosts)
    const rankingScore = safeNum(Math.round(rawScore));

    // Trending score (independent calculation)
    const trendingScore = calculateTrendingScore(listing);

    return {
        rankingScore,
        freshnessScore: safeNum(Math.round(freshnessScore)),
        qualityScore,
        completionPercentage,
        engagementScore: safeNum(Math.round(engagementScore)),
        verificationScore: safeNum(Math.round(verificationScore)),
        priceCompetitivenessScore: safeNum(Math.round(priceCompetitivenessScore)),
        locationDemandScore: safeNum(Math.round(locationDemandScore)),
        trendingScore
    };
};

// ═════════════════════════════════════════════════════════════════════════════
//  Pre-computation Helpers
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Computes population-level engagement statistics for z-score normalization.
 */
const computeEngagementStats = (listings) => {
    const rawScores = listings.map(l =>
        (l.views || 0) * ENGAGEMENT_METRIC_WEIGHTS.views +
        (l.uniqueViews || 0) * ENGAGEMENT_METRIC_WEIGHTS.uniqueViews +
        (l.whatsappClicks || 0) * ENGAGEMENT_METRIC_WEIGHTS.whatsappClicks +
        (l.phoneClicks || 0) * ENGAGEMENT_METRIC_WEIGHTS.phoneClicks +
        (l.inquiries || 0) * ENGAGEMENT_METRIC_WEIGHTS.inquiries +
        (l.favoritesCount || 0) * ENGAGEMENT_METRIC_WEIGHTS.favoritesCount +
        (l.shares || 0) * ENGAGEMENT_METRIC_WEIGHTS.shares
    );

    if (rawScores.length === 0) return { mean: 0, stdDev: 1 };

    const mean = rawScores.reduce((s, v) => s + v, 0) / rawScores.length;
    const variance = rawScores.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / rawScores.length;
    const stdDev = Math.sqrt(variance) || 1; // Prevent division by zero

    return { mean, stdDev };
};

/**
 * Computes median price-per-sqyd for each city+propertyType combination.
 */
const computeMedianPriceMap = (listings) => {
    const groups = {};

    listings.forEach(l => {
        if (!l.pricePerSqYd || l.pricePerSqYd <= 0) return;
        const city = (l.city || '').toLowerCase().trim();
        if (!city) return;
        const key = `${city}|${l.propertyType || 'Plot'}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(l.pricePerSqYd);
    });

    const medianMap = {};
    for (const [key, prices] of Object.entries(groups)) {
        prices.sort((a, b) => a - b);
        const mid = Math.floor(prices.length / 2);
        medianMap[key] = prices.length % 2 === 0
            ? (prices[mid - 1] + prices[mid]) / 2
            : prices[mid];
    }

    return medianMap;
};

/**
 * Detects duplicates using fuzzy title matching + same-seller heuristics.
 * Marks listings as isDuplicate with more sophisticated detection than exact matching.
 */
const detectDuplicates = (listings) => {
    // Group by seller for same-seller duplicate detection
    const sellerMap = new Map();
    listings.forEach(l => {
        const sellerId = l.createdBy?.toString() || 'unknown';
        if (!sellerMap.has(sellerId)) sellerMap.set(sellerId, []);
        sellerMap.get(sellerId).push(l);
    });

    // Title-based duplicate detection (normalized)
    const titleMap = new Map();
    listings.forEach(l => {
        // Normalize: lowercase, remove extra spaces, remove common filler words
        const cleanTitle = l.title.toLowerCase().trim()
            .replace(/\s+/g, ' ')
            .replace(/\b(plot|land|for sale|available|near|in)\b/gi, '')
            .trim();

        if (titleMap.has(cleanTitle)) {
            titleMap.get(cleanTitle).push(l);
        } else {
            titleMap.set(cleanTitle, [l]);
        }
    });

    // Mark exact title duplicates
    for (const [, list] of titleMap.entries()) {
        if (list.length > 1) {
            list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            for (let i = 1; i < list.length; i++) {
                list[i].isDuplicate = true;
            }
        }
    }

    // Same-seller heuristic: same seller + similar price + same city within 7 days
    for (const [, sellerListings] of sellerMap.entries()) {
        if (sellerListings.length < 2) continue;

        sellerListings.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        for (let i = 0; i < sellerListings.length; i++) {
            for (let j = i + 1; j < sellerListings.length; j++) {
                const a = sellerListings[i];
                const b = sellerListings[j];

                if (b.isDuplicate) continue; // Already flagged

                const daysDiff = Math.abs(new Date(b.createdAt) - new Date(a.createdAt)) / (1000 * 60 * 60 * 24);
                const sameCity = a.city && b.city &&
                    a.city.toLowerCase().trim() === b.city.toLowerCase().trim();
                const priceSimilar = a.price && b.price &&
                    Math.abs(a.price - b.price) / Math.max(a.price, b.price) < 0.1; // Within 10%

                if (daysDiff <= 7 && sameCity && priceSimilar) {
                    b.isDuplicate = true;
                }
            }
        }
    }

    // Clear duplicate flag for non-duplicates
    listings.forEach(l => {
        if (l.isDuplicate === undefined) l.isDuplicate = false;
    });
};

/**
 * Computes seller listing velocity (listings created in last 24h per seller).
 */
const computeSellerVelocities = async () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const velocities = await Listing.aggregate([
        {
            $match: {
                createdAt: { $gte: oneDayAgo },
                status: 'Active'
            }
        },
        {
            $group: {
                _id: '$createdBy',
                count: { $sum: 1 }
            }
        }
    ]);

    const velocityMap = {};
    velocities.forEach(v => {
        velocityMap[v._id.toString()] = v.count;
    });

    return velocityMap;
};

// ═════════════════════════════════════════════════════════════════════════════
//  Batch Score Update (Cron Job Entry Point)
// ═════════════════════════════════════════════════════════════════════════════

const updateAllScores = async () => {
    const startTime = Date.now();
    try {
        console.log('═══ Starting batch ranking score calculations ═══');

        // Pre-computation Phase
        console.log('Phase 1: Pre-computing aggregate data...');

        // 1. Refresh location demand cache
        const demandMap = await refreshLocationDemandCache();

        // 2. Fetch all active listings
        const listings = await Listing.find({ status: 'Active' });
        console.log(`Found ${listings.length} active listings to recalculate.`);

        if (listings.length === 0) {
            console.log('No active listings to process.');
            return { success: true, count: 0 };
        }

        // 3. Compute engagement population stats (for z-score normalization)
        const engagementStats = computeEngagementStats(listings);
        console.log(`Engagement stats — mean: ${engagementStats.mean.toFixed(1)}, stdDev: ${engagementStats.stdDev.toFixed(1)}`);

        // 4. Compute median price-per-sqyd map
        const medianPriceMap = computeMedianPriceMap(listings);
        console.log(`Price median map: ${Object.keys(medianPriceMap).length} city+type combinations`);

        // 5. Detect duplicates (fuzzy)
        console.log('Phase 2: Detecting duplicates...');
        detectDuplicates(listings);

        // 6. Compute seller velocities
        const velocityMap = await computeSellerVelocities();

        // Score Computation Phase
        console.log('Phase 3: Computing scores...');

        // Cache user lookups to avoid N+1 queries
        const userCache = new Map();
        const getUserCached = async (userId) => {
            const key = userId?.toString();
            if (!key) return null;
            if (userCache.has(key)) return userCache.get(key);
            const user = await User.findById(key);
            userCache.set(key, user);
            return user;
        };

        // Build bulk operations
        const bulkOps = [];
        let updatedCount = 0;
        let errorCount = 0;

        for (const listing of listings) {
            try {
                const user = await getUserCached(listing.createdBy);
                const trustScore = calculateUserTrustScore(user);

                // Set seller velocity on listing
                const sellerId = listing.createdBy?.toString();
                listing.sellerListingVelocity = velocityMap[sellerId] || 0;

                // Compute pricePerSqYd if missing (for old listings)
                if (!listing.pricePerSqYd && listing.numericArea > 0 && listing.price > 0) {
                    listing.pricePerSqYd = Math.round(listing.price / listing.numericArea);
                }

                // Compute all scores
                const scores = calculateListingRankingScore(
                    listing, user, engagementStats, medianPriceMap, demandMap
                );

                // Update user trust score if changed
                if (user && user.trustScore !== trustScore) {
                    user.trustScore = trustScore;
                    await user.save();
                }

                // Build bulk update operation
                bulkOps.push({
                    updateOne: {
                        filter: { _id: listing._id },
                        update: {
                            $set: {
                                rankingScore: scores.rankingScore,
                                freshnessScore: scores.freshnessScore,
                                qualityScore: scores.qualityScore,
                                completionPercentage: scores.completionPercentage,
                                engagementScore: scores.engagementScore,
                                verificationScore: scores.verificationScore,
                                priceCompetitivenessScore: scores.priceCompetitivenessScore,
                                locationDemandScore: scores.locationDemandScore,
                                trendingScore: scores.trendingScore,
                                isDuplicate: listing.isDuplicate,
                                sellerListingVelocity: listing.sellerListingVelocity,
                                pricePerSqYd: listing.pricePerSqYd || 0
                            }
                        }
                    }
                });

                updatedCount++;
            } catch (err) {
                errorCount++;
                console.error(`Error scoring listing ${listing._id}: ${err.message}`);
            }
        }

        // Execute bulk write in batches of 500
        if (bulkOps.length > 0) {
            const BATCH_SIZE = 500;
            for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
                const batch = bulkOps.slice(i, i + BATCH_SIZE);
                await Listing.bulkWrite(batch, { ordered: false });
            }
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`═══ Ranking complete: ${updatedCount} updated, ${errorCount} errors, ${elapsed}s elapsed ═══`);
        return { success: true, count: updatedCount, errors: errorCount, elapsedSeconds: parseFloat(elapsed) };
    } catch (err) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.error(`Failed to run batch ranking calculations (${elapsed}s):`, err);
        return { success: false, error: err.message };
    }
};

module.exports = {
    calculateQualityScore,
    calculateUserTrustScore,
    calculateListingRankingScore,
    calculateFreshnessScore,
    calculateEngagementScore,
    calculateVerificationScore,
    calculatePriceCompetitiveness,
    calculateTrendingScore,
    computeAntiSpamMultiplier,
    updateAllScores,
    FACTOR_WEIGHTS,
    ENGAGEMENT_METRIC_WEIGHTS
};
