const Listing = require('../models/Listing');
const { parseSearchQuery } = require('../utils/searchParser');

/**
 * Builds the MongoDB Atlas Search ($search) aggregation pipeline stage.
 */
const buildAtlasSearchStage = (params) => {
    const {
        search,
        city,
        locality,
        propertyType,
        plotType,
        landType,
        minPrice,
        maxPrice,
        minArea,
        maxArea,
        listingType,
        isFeatured,
        roadTouch,
        cornerPlot,
        isAgricultural,
        ownerType,
        status = 'Active',
        isTokened,
        lat,
        lng,
        radius
    } = params;

    const must = [];
    const should = [];
    const filter = [];
    const mustNot = [];

    // 1. Text Search & Typo Tolerance
    if (search) {
        const autocompletePaths = ['title', 'location', 'city', 'locality', 'areaName'];
        autocompletePaths.forEach(path => {
            should.push({
                autocomplete: {
                    query: search,
                    path: path,
                    fuzzy: { maxEdits: 1, prefixLength: 1 }
                }
            });
        });

        should.push({
            text: {
                query: search,
                path: ['title', 'description', 'location', 'city', 'locality', 'areaName'],
                fuzzy: { maxEdits: 1 }
            }
        });
    }

    // 2. Geospatial Search (geoWithin + near for ranking)
    if (lat && lng) {
        const parsedLat = parseFloat(lat);
        const parsedLng = parseFloat(lng);
        const parsedRadius = parseFloat(radius) || 25; // Default 25km

        filter.push({
            geoWithin: {
                path: "geoSpatialLocation",
                circle: {
                    center: {
                        type: "Point",
                        coordinates: [parsedLng, parsedLat]
                    },
                    radius: parsedRadius * 1000 // meters
                }
            }
        });

        should.push({
            near: {
                path: "geoSpatialLocation",
                origin: {
                    type: "Point",
                    coordinates: [parsedLng, parsedLat]
                },
                pivot: parsedRadius * 1000
            }
        });
    }

    // 3. Dynamic Filtering Mappings
    if (city) {
        filter.push({ text: { path: "city", query: city } });
    }
    if (locality) {
        filter.push({ text: { path: "locality", query: locality } });
    }
    if (propertyType) {
        filter.push({ text: { path: "propertyType", query: propertyType } });
    }
    if (plotType && plotType !== 'None') {
        filter.push({ text: { path: "plotType", query: plotType } });
    }
    if (landType && landType !== 'None') {
        filter.push({ text: { path: "landType", query: landType } });
    }
    if (ownerType) {
        filter.push({ text: { path: "ownerType", query: ownerType } });
    }
    if (listingType) {
        filter.push({ text: { path: "listingType", query: listingType } });
    }
    if (status) {
        filter.push({ text: { path: "status", query: status } });
    }

    // Booleans
    if (isFeatured === 'true' || isFeatured === true) {
        filter.push({ equals: { path: "isFeatured", value: true } });
    }
    if (roadTouch === 'true' || roadTouch === true) {
        filter.push({ equals: { path: "roadTouch", value: true } });
    }
    if (cornerPlot === 'true' || cornerPlot === true) {
        filter.push({ equals: { path: "cornerPlot", value: true } });
    }
    if (isAgricultural === 'true' || isAgricultural === true) {
        filter.push({ equals: { path: "isAgricultural", value: true } });
    }
    if (isAgricultural === 'false' || isAgricultural === false) {
        filter.push({ equals: { path: "isAgricultural", value: false } });
    }

    // Status exclusions & reservation defaults
    if (isTokened === 'true' || isTokened === true) {
        filter.push({ equals: { path: "isTokened", value: true } });
    } else if (isTokened === 'false' || isTokened === false) {
        filter.push({ equals: { path: "isTokened", value: false } });
    } else {
        mustNot.push({ equals: { path: "isTokened", value: true } });
    }

    // Ranges (Price & Numeric Area)
    if (minPrice || maxPrice) {
        const range = { path: "price" };
        if (minPrice) range.gte = parseFloat(minPrice);
        if (maxPrice) range.lte = parseFloat(maxPrice);
        filter.push({ range });
    }
    if (minArea || maxArea) {
        const range = { path: "numericArea" };
        if (minArea) range.gte = parseFloat(minArea);
        if (maxArea) range.lte = parseFloat(maxArea);
        filter.push({ range });
    }

    const searchStage = {
        index: "default",
        compound: {}
    };

    if (must.length > 0) searchStage.compound.must = must;
    if (should.length > 0) searchStage.compound.should = should;
    if (filter.length > 0) searchStage.compound.filter = filter;
    if (mustNot.length > 0) searchStage.compound.mustNot = mustNot;

    // Wildcard fallback if no conditions are supplied
    if (Object.keys(searchStage.compound).length === 0) {
        searchStage.compound.must = [{
            wildcard: {
                path: "title",
                query: "*",
                allowAnalyzedField: true
            }
        }];
    }

    return searchStage;
};

/**
 * Builds the fallback standard Mongoose $match query object.
 */
const buildFallbackMatchQuery = (params) => {
    const {
        search,
        city,
        locality,
        propertyType,
        plotType,
        landType,
        minPrice,
        maxPrice,
        minArea,
        maxArea,
        listingType,
        isFeatured,
        roadTouch,
        cornerPlot,
        isAgricultural,
        ownerType,
        status = 'Active',
        isTokened,
        lat,
        lng,
        radius
    } = params;

    const query = {};

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { location: { $regex: search, $options: 'i' } },
            { city: { $regex: search, $options: 'i' } },
            { locality: { $regex: search, $options: 'i' } }
        ];
    }

    if (lat && lng) {
        const parsedLat = parseFloat(lat);
        const parsedLng = parseFloat(lng);
        const parsedRadius = parseFloat(radius) || 25;

        query.geoSpatialLocation = {
            $geoWithin: {
                $centerSphere: [
                    [parsedLng, parsedLat],
                    parsedRadius / 6378.1 // convert km to radians
                ]
            }
        };
    }

    if (city) query.city = new RegExp(`^${city}$`, 'i');
    if (locality) query.locality = new RegExp(`^${locality}$`, 'i');
    if (propertyType) query.propertyType = propertyType;
    if (plotType && plotType !== 'None') query.plotType = plotType;
    if (landType && landType !== 'None') query.landType = landType;
    if (ownerType) query.ownerType = ownerType;
    if (listingType) query.listingType = listingType;
    if (status) query.status = status;

    if (isFeatured !== undefined) {
        query.isFeatured = isFeatured === 'true' || isFeatured === true;
    }
    if (roadTouch !== undefined) {
        query.roadTouch = roadTouch === 'true' || roadTouch === true;
    }
    if (cornerPlot !== undefined) {
        query.cornerPlot = cornerPlot === 'true' || cornerPlot === true;
    }
    
    if (isAgricultural !== undefined) {
        query.isAgricultural = isAgricultural === 'true' || isAgricultural === true;
    }

    if (isTokened !== undefined) {
        query.isTokened = isTokened === 'true' || isTokened === true;
    } else {
        query.isTokened = { $ne: true };
    }

    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (minArea || maxArea) {
        query.numericArea = {};
        if (minArea) query.numericArea.$gte = Number(minArea);
        if (maxArea) query.numericArea.$lte = Number(maxArea);
    }

    return query;
};

/**
 * Searches properties utilizing MongoDB Atlas Search with fallback to Mongoose aggregation.
 */
exports.searchProperties = async (params) => {
    const page = parseInt(params.page, 10) || 1;
    const limit = parseInt(params.limit, 10) || 12;
    const startIndex = (page - 1) * limit;
    
    // 15 Dynamic Sorting Modes selection mapping
    // Default to 'recommended' (dynamic rankingScore)
    const sortBy = params.sort || 'recommended';

    // ── Semantic search parsing integration ──
    if (params.search) {
        const parsed = parseSearchQuery(params.search);
        if (parsed.maxPrice && !params.maxPrice) params.maxPrice = parsed.maxPrice;
        if (parsed.minPrice && !params.minPrice) params.minPrice = parsed.minPrice;
        if (parsed.plotType && !params.plotType) params.plotType = parsed.plotType;
        if (parsed.landType && !params.landType) params.landType = parsed.landType;
        if (parsed.minArea && !params.minArea) params.minArea = parsed.minArea;
        if (parsed.location && !params.city) params.city = parsed.location;
    }

    const useAtlasSearch = !!(params.search || (params.lat && params.lng));
    let pipeline = [];

    // Base match/search stage
    if (useAtlasSearch) {
        pipeline.push({ $search: buildAtlasSearchStage(params) });
    } else {
        pipeline.push({ $match: buildFallbackMatchQuery(params) });
    }

    // Lookup user creators early so we can sort by creator's trustScore
    pipeline.push({
        $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'createdBy'
        }
    });
    pipeline.push({ $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } });

    // Inject best value computation helper if requested
    if (sortBy === 'best_value') {
        pipeline.push({
            $addFields: {
                bestValueScore: {
                    $cond: [
                        { $or: [{ $eq: ["$price", 0] }, { $not: ["$price"] }] },
                        0,
                        { $divide: ["$numericArea", "$price"] }
                    ]
                }
            }
        });
    }

    // Sort order definition matching all 15 sort modes
    const sortStage = {};
    switch (sortBy) {
        case 'recommended':
            sortStage.rankingScore = -1;
            break;
        case 'trending':
            sortStage.trendingScore = -1;
            break;
        case 'featured':
            sortStage.isFeatured = -1;
            sortStage.rankingScore = -1;
            break;
        case 'newest':
            sortStage.createdAt = -1;
            break;
        case 'price':
        case 'price_asc':
            sortStage.price = 1;
            break;
        case '-price':
        case 'price_desc':
            sortStage.price = -1;
            break;
        case 'best_value':
            sortStage.bestValueScore = -1;
            break;
        case 'most_viewed':
            sortStage.views = -1;
            break;
        case 'most_contacted':
            sortStage.phoneClicks = -1;
            sortStage.whatsappClicks = -1;
            sortStage.contacts = -1;
            break;
        case 'recently_updated':
            sortStage.updatedAt = -1;
            break;
        case 'verified_first':
            sortStage.listingType = -1; // Verified is string, basic is Basic
            sortStage.rankingScore = -1;
            break;
        case 'premium_first':
            sortStage.isFeatured = -1;
            sortStage.rankingScore = -1;
            break;
        case 'largest_area':
            sortStage.numericArea = -1;
            break;
        case 'smallest_area':
            sortStage.numericArea = 1;
            break;
        case 'highest_rated_sellers':
            sortStage['createdBy.trustScore'] = -1;
            sortStage.rankingScore = -1;
            break;
        default:
            sortStage.rankingScore = -1;
            break;
    }

    // Attach dynamic geospatial distance calculations if center coordinates are supplied
    if (params.lat && params.lng) {
        const userLat = parseFloat(params.lat);
        const userLng = parseFloat(params.lng);
        pipeline.push({
            $addFields: {
                distance: {
                    $multiply: [
                        6371, // Earth radius in km
                        {
                            $acos: {
                                $add: [
                                    {
                                        $multiply: [
                                            { $sin: { $multiply: [userLat, Math.PI / 180] } },
                                            { $sin: { $multiply: [{ $first: "$geoSpatialLocation.coordinates" }, Math.PI / 180] } }
                                        ]
                                    },
                                    {
                                        $multiply: [
                                            { $cos: { $multiply: [userLat, Math.PI / 180] } },
                                            { $cos: { $multiply: [{ $first: "$geoSpatialLocation.coordinates" }, Math.PI / 180] } },
                                            { $cos: { $subtract: [{ $multiply: [{ $last: "$geoSpatialLocation.coordinates" }, Math.PI / 180] }, { $multiply: [userLng, Math.PI / 180] }] } }
                                        ]
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        });
        
        // If sorting nearby, override sort parameters
        if (sortBy === 'nearby') {
            delete sortStage.rankingScore;
            sortStage.distance = 1;
        }
    }

    pipeline.push({ $sort: sortStage });

    // Facet configuration for metadata and records
    pipeline.push({
        $facet: {
            metadata: [{ $count: "total" }],
            data: [
                { $skip: startIndex },
                { $limit: limit },
                {
                    $project: {
                        'createdBy.password': 0,
                        'createdBy.token': 0,
                        'createdBy.otp': 0,
                        'createdBy.otpExpire': 0
                    }
                }
            ]
        }
    });

    try {
        let result = await Listing.aggregate(pipeline);
        let data = result[0]?.data || [];
        let total = result[0]?.metadata[0]?.total || 0;

        // If Atlas Search returned 0 matches, run fallback query
        if (useAtlasSearch && data.length === 0) {
            const fallbackQuery = buildFallbackMatchQuery(params);
            const fallbackCount = await Listing.countDocuments(fallbackQuery);
            if (fallbackCount > 0) {
                console.info(`Atlas Search returned 0 matches. Recovering with Mongoose matching.`);
                const fallbackPipeline = [
                    { $match: fallbackQuery },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'createdBy',
                            foreignField: '_id',
                            as: 'createdBy'
                        }
                    },
                    { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } }
                ];

                if (sortBy === 'best_value') {
                    fallbackPipeline.push({
                        $addFields: {
                            bestValueScore: {
                                $cond: [
                                    { $or: [{ $eq: ["$price", 0] }, { $not: ["$price"] }] },
                                    0,
                                    { $divide: ["$numericArea", "$price"] }
                                ]
                            }
                        }
                    });
                }

                fallbackPipeline.push({ $sort: sortStage });
                fallbackPipeline.push({
                    $facet: {
                        metadata: [{ $count: "total" }],
                        data: [
                            { $skip: startIndex },
                            { $limit: limit },
                            {
                                $project: {
                                    'createdBy.password': 0,
                                    'createdBy.token': 0,
                                    'createdBy.otp': 0,
                                    'createdBy.otpExpire': 0
                                }
                            }
                        ]
                    }
                });

                const fallbackResult = await Listing.aggregate(fallbackPipeline);
                data = fallbackResult[0]?.data || [];
                total = fallbackResult[0]?.metadata[0]?.total || 0;
            }
        }

        const totalPages = Math.ceil(total / limit);

        return {
            data,
            total,
            currentPage: page,
            totalPages,
            limit
        };
    } catch (error) {
        if (useAtlasSearch && error.name === 'MongoServerError') {
            console.warn("Atlas Search failed. Running fallback matching:", error.message);
            const fallbackPipeline = [
                { $match: buildFallbackMatchQuery(params) },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'createdBy',
                        foreignField: '_id',
                        as: 'createdBy'
                    }
                },
                { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } }
            ];

            if (sortBy === 'best_value') {
                fallbackPipeline.push({
                    $addFields: {
                        bestValueScore: {
                            $cond: [
                                { $or: [{ $eq: ["$price", 0] }, { $not: ["$price"] }] },
                                0,
                                { $divide: ["$numericArea", "$price"] }
                            ]
                        }
                    }
                });
            }

            fallbackPipeline.push({ $sort: sortStage });
            fallbackPipeline.push({
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $skip: startIndex },
                        { $limit: limit },
                        {
                            $project: {
                                'createdBy.password': 0,
                                'createdBy.token': 0,
                                'createdBy.otp': 0,
                                'createdBy.otpExpire': 0
                            }
                        }
                    ]
                }
            });

            const fallbackResult = await Listing.aggregate(fallbackPipeline);
            const data = fallbackResult[0]?.data || [];
            const total = fallbackResult[0]?.metadata[0]?.total || 0;
            const totalPages = Math.ceil(total / limit);

            return {
                data,
                total,
                currentPage: page,
                totalPages,
                limit
            };
        }

        throw error;
    }
};

/**
 * Real-time autocomplete query for search boxes.
 */
exports.getSearchSuggestions = async (q) => {
    try {
        const results = await Listing.aggregate([
            {
                $search: {
                    index: "default",
                    compound: {
                        should: [
                            { autocomplete: { query: q, path: "title", fuzzy: { maxEdits: 1, prefixLength: 1 } } },
                            { autocomplete: { query: q, path: "city", fuzzy: { maxEdits: 1, prefixLength: 1 } } },
                            { autocomplete: { query: q, path: "locality", fuzzy: { maxEdits: 1, prefixLength: 1 } } },
                            { autocomplete: { query: q, path: "location", fuzzy: { maxEdits: 1, prefixLength: 1 } } },
                            { autocomplete: { query: q, path: "areaName", fuzzy: { maxEdits: 1, prefixLength: 1 } } }
                        ]
                    }
                }
            },
            { $limit: 8 },
            {
                $project: {
                    title: 1,
                    location: 1,
                    price: 1,
                    listingType: 1,
                    images: 1,
                    area: 1,
                    plotNumber: 1,
                    areaName: 1
                }
            }
        ]);
        if (results && results.length > 0) return results;
        
        return await Listing.find({
            status: { $ne: 'Inactive' },
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { location: { $regex: q, $options: 'i' } },
                { city: { $regex: q, $options: 'i' } },
                { locality: { $regex: q, $options: 'i' } }
            ]
        })
        .sort('-views')
        .limit(8)
        .select('title location price listingType images area plotNumber areaName');
    } catch (err) {
        return await Listing.find({
            status: { $ne: 'Inactive' },
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { location: { $regex: q, $options: 'i' } },
                { city: { $regex: q, $options: 'i' } },
                { locality: { $regex: q, $options: 'i' } }
            ]
        })
        .sort('-views')
        .limit(8)
        .select('title location price listingType images area plotNumber areaName');
    }
};
