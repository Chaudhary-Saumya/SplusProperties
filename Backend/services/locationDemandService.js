const UserActivity = require('../models/UserActivity');
const Setting = require('../models/Setting');

/**
 * Aggregates search + view activity per city+locality from UserActivity
 * to produce location demand scores. Results are cached in a Setting document
 * and used by the ranking service to weight listings in high-demand areas.
 * 
 * Demand is calculated from the last 30 days of user activity.
 * Scores are percentile-ranked to a 0-100 scale.
 */

const DEMAND_CACHE_KEY = 'location_demand_cache';
const DEMAND_WINDOW_DAYS = 30;

/**
 * Computes demand scores for all city+locality combinations.
 * Returns a Map-like object: { "ahmedabad": score, "ahmedabad|bopal": score }
 */
const computeLocationDemandScores = async () => {
    const cutoff = new Date(Date.now() - DEMAND_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    // Aggregate views + searches by location from UserActivity
    // We join with Listings to get the city/locality of viewed listings
    const viewDemand = await UserActivity.aggregate([
        {
            $match: {
                actionType: { $in: ['VIEW', 'SEARCH', 'CONTACT'] },
                createdAt: { $gte: cutoff }
            }
        },
        {
            $lookup: {
                from: 'listings',
                localField: 'actionDetails.listingId',
                foreignField: '_id',
                as: 'listing'
            }
        },
        { $unwind: { path: '$listing', preserveNullAndEmptyArrays: false } },
        {
            $group: {
                _id: {
                    city: { $toLower: { $trim: { input: { $ifNull: ['$listing.city', ''] } } } },
                    locality: { $toLower: { $trim: { input: { $ifNull: ['$listing.locality', ''] } } } }
                },
                // Weight different actions differently
                score: {
                    $sum: {
                        $switch: {
                            branches: [
                                { case: { $eq: ['$actionType', 'CONTACT'] }, then: 5 },
                                { case: { $eq: ['$actionType', 'VIEW'] }, then: 1 },
                                { case: { $eq: ['$actionType', 'SEARCH'] }, then: 2 }
                            ],
                            default: 1
                        }
                    }
                }
            }
        },
        { $sort: { score: -1 } }
    ]);

    if (!viewDemand || viewDemand.length === 0) {
        return {};
    }

    // Compute percentile-based normalization (0-100)
    const scores = viewDemand.map(d => d.score);
    const maxScore = Math.max(...scores, 1); // Prevent division by zero

    const demandMap = {};

    for (const entry of viewDemand) {
        const city = entry._id.city;
        const locality = entry._id.locality;
        // Normalize to 0-100 using max normalization
        const normalizedScore = Math.round((entry.score / maxScore) * 100);

        // City-level key
        if (city) {
            const cityKey = city;
            demandMap[cityKey] = Math.max(demandMap[cityKey] || 0, normalizedScore);
        }

        // City+Locality-level key (more specific, takes precedence)
        if (city && locality) {
            const localityKey = `${city}|${locality}`;
            demandMap[localityKey] = normalizedScore;
        }
    }

    return demandMap;
};

/**
 * Refreshes the location demand cache in the Settings collection.
 * Called by the cron job before ranking recalculation.
 */
const refreshLocationDemandCache = async () => {
    try {
        console.log('Computing location demand scores...');
        const demandMap = await computeLocationDemandScores();
        const entryCount = Object.keys(demandMap).length;

        await Setting.findOneAndUpdate(
            { key: DEMAND_CACHE_KEY },
            {
                key: DEMAND_CACHE_KEY,
                value: demandMap,
                description: `Auto-generated location demand cache. ${entryCount} locations tracked.`
            },
            { upsert: true, new: true }
        );

        console.log(`Location demand cache updated: ${entryCount} location entries.`);
        return demandMap;
    } catch (err) {
        console.error('Failed to compute location demand:', err.message);
        return {};
    }
};

/**
 * Fetches the cached demand map from Settings.
 * Returns an object where keys are "city" or "city|locality" and values are 0-100 scores.
 */
const getCachedDemandMap = async () => {
    try {
        const cached = await Setting.findOne({ key: DEMAND_CACHE_KEY });
        return cached?.value || {};
    } catch {
        return {};
    }
};

/**
 * Looks up the demand score for a specific listing's location.
 * Prefers city+locality match; falls back to city-only.
 */
const getDemandScoreForListing = (demandMap, listing) => {
    const city = (listing.city || '').toLowerCase().trim();
    const locality = (listing.locality || '').toLowerCase().trim();

    if (!city) return 0;

    // Try specific locality match first
    if (locality) {
        const localityKey = `${city}|${locality}`;
        if (demandMap[localityKey] !== undefined) {
            return demandMap[localityKey];
        }
    }

    // Fall back to city-level
    return demandMap[city] || 0;
};

module.exports = {
    computeLocationDemandScores,
    refreshLocationDemandCache,
    getCachedDemandMap,
    getDemandScoreForListing
};
