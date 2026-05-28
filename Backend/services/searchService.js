const Listing = require('../models/Listing');

/**
 * Builds the MongoDB Atlas Search ($search) aggregation pipeline stage.
 * @param {Object} params - Search and filter parameters
 * @returns {Object} Atlas Search stage object
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
 * @param {Object} params - Search and filter parameters
 * @returns {Object} Mongoose query object
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
 * @param {Object} params - Search filters and pagination info
 * @returns {Object} Results matching query along with count/metadata
 */
exports.searchProperties = async (params) => {
    const page = parseInt(params.page, 10) || 1;
    const limit = parseInt(params.limit, 10) || 12;
    const startIndex = (page - 1) * limit;
    const sortBy = params.sort || '-createdAt';

    // Decide if we should try Atlas Search
    // Real-time search terms or geospatial coordinates trigger Atlas Search
    const useAtlasSearch = !!(params.search || (params.lat && params.lng));

    let pipeline = [];

    if (useAtlasSearch) {
        pipeline.push({ $search: buildAtlasSearchStage(params) });
    } else {
        pipeline.push({ $match: buildFallbackMatchQuery(params) });
    }

    // Dynamic scoring / field mapping for trending score
    if (sortBy === 'trending') {
        pipeline.push({
            $addFields: {
                trendingScore: {
                    $add: [
                        { $multiply: [{ $ifNull: ["$contacts", 0] }, 10] },
                        { $multiply: [{ $ifNull: ["$favoritesCount", 0] }, 5] },
                        { $ifNull: ["$views", 0] }
                    ]
                }
            }
        });
    }

    // Sort order definition
    if (sortBy === 'trending') {
        pipeline.push({ $sort: { trendingScore: -1 } });
    } else if (sortBy === '-createdAt') {
        pipeline.push({ $sort: { createdAt: -1 } });
    } else if (sortBy === 'price') {
        pipeline.push({ $sort: { price: 1 } });
    } else if (sortBy === '-price') {
        pipeline.push({ $sort: { price: -1 } });
    } else if (sortBy === '-numericArea') {
        pipeline.push({ $sort: { numericArea: -1 } });
    } else {
        pipeline.push({ $sort: { createdAt: -1 } });
    }

    // Facet configuration for metadata and records
    pipeline.push({
        $facet: {
            metadata: [{ $count: "total" }],
            data: [
                { $skip: startIndex },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'createdBy',
                        foreignField: '_id',
                        as: 'createdBy'
                    }
                },
                { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
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

        // Smart fallback: If Atlas Search was requested but returned 0 matches,
        // it may be that the Atlas Search Index is empty or still building.
        // We verify if there are matches in the database via standard query fallback.
        if (useAtlasSearch && data.length === 0) {
            const fallbackQuery = buildFallbackMatchQuery(params);
            const fallbackCount = await Listing.countDocuments(fallbackQuery);
            if (fallbackCount > 0) {
                console.info(`Atlas Search returned 0 matches, but fallback query matches ${fallbackCount} documents. Falling back to Mongoose matching.`);
                const fallbackPipeline = [
                    { $match: fallbackQuery }
                ];

                if (sortBy === 'trending') {
                    fallbackPipeline.push({
                        $addFields: {
                            trendingScore: {
                                $add: [
                                    { $multiply: [{ $ifNull: ["$contacts", 0] }, 10] },
                                    { $multiply: [{ $ifNull: ["$favoritesCount", 0] }, 5] },
                                    { $ifNull: ["$views", 0] }
                                ]
                            }
                        }
                    });
                    fallbackPipeline.push({ $sort: { trendingScore: -1 } });
                } else if (sortBy === '-createdAt') {
                    fallbackPipeline.push({ $sort: { createdAt: -1 } });
                } else if (sortBy === 'price') {
                    fallbackPipeline.push({ $sort: { price: 1 } });
                } else if (sortBy === '-price') {
                    fallbackPipeline.push({ $sort: { price: -1 } });
                } else if (sortBy === '-numericArea') {
                    fallbackPipeline.push({ $sort: { numericArea: -1 } });
                } else {
                    fallbackPipeline.push({ $sort: { createdAt: -1 } });
                }

                fallbackPipeline.push({
                    $facet: {
                        metadata: [{ $count: "total" }],
                        data: [
                            { $skip: startIndex },
                            { $limit: limit },
                            {
                                $lookup: {
                                    from: 'users',
                                    localField: 'createdBy',
                                    foreignField: '_id',
                                    as: 'createdBy'
                                }
                            },
                            { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
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
        // If Atlas Search failed (e.g. index doesn't exist yet on local test databases)
        if (useAtlasSearch && error.name === 'MongoServerError') {
            console.warn("Atlas Search failed. Recovering using Mongoose match fallback:", error.message);
            // Re-run execution using pure Match fallback
            const fallbackPipeline = [
                { $match: buildFallbackMatchQuery(params) }
            ];

            if (sortBy === 'trending') {
                fallbackPipeline.push({
                    $addFields: {
                        trendingScore: {
                            $add: [
                                { $multiply: [{ $ifNull: ["$contacts", 0] }, 10] },
                                { $multiply: [{ $ifNull: ["$favoritesCount", 0] }, 5] },
                                { $ifNull: ["$views", 0] }
                            ]
                        }
                    }
                });
                fallbackPipeline.push({ $sort: { trendingScore: -1 } });
            } else if (sortBy === '-createdAt') {
                fallbackPipeline.push({ $sort: { createdAt: -1 } });
            } else if (sortBy === 'price') {
                fallbackPipeline.push({ $sort: { price: 1 } });
            } else if (sortBy === '-price') {
                fallbackPipeline.push({ $sort: { price: -1 } });
            } else if (sortBy === '-numericArea') {
                fallbackPipeline.push({ $sort: { numericArea: -1 } });
            } else {
                fallbackPipeline.push({ $sort: { createdAt: -1 } });
            }

            fallbackPipeline.push({
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $skip: startIndex },
                        { $limit: limit },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'createdBy',
                                foreignField: '_id',
                                as: 'createdBy'
                            }
                        },
                        { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
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

        // Throw other errors
        throw error;
    }
};

/**
 * Real-time autocomplete query for search boxes.
 * @param {String} q - Search keyword
 * @returns {Array} List of matched listing suggestions
 */
exports.getSearchSuggestions = async (q) => {
    try {
        const results = await Listing.aggregate([
            {
                $search: {
                    index: "default",
                    compound: {
                        should: [
                            {
                                autocomplete: {
                                    query: q,
                                    path: "title",
                                    fuzzy: { maxEdits: 1, prefixLength: 1 }
                                }
                            },
                            {
                                autocomplete: {
                                    query: q,
                                    path: "city",
                                    fuzzy: { maxEdits: 1, prefixLength: 1 }
                                }
                            },
                            {
                                autocomplete: {
                                    query: q,
                                    path: "locality",
                                    fuzzy: { maxEdits: 1, prefixLength: 1 }
                                }
                            },
                            {
                                autocomplete: {
                                    query: q,
                                    path: "location",
                                    fuzzy: { maxEdits: 1, prefixLength: 1 }
                                }
                            },
                            {
                                autocomplete: {
                                    query: q,
                                    path: "areaName",
                                    fuzzy: { maxEdits: 1, prefixLength: 1 }
                                }
                            }
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
        if (results && results.length > 0) {
            return results;
        }
        
        // Fallback if Atlas Search runs but indexes are empty/building
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
        console.warn("Atlas Search suggestions failed, running fallback regex matching:", err.message);
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
