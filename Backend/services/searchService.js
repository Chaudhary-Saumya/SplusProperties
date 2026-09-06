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
        radius,
        // Advanced filters
        gatedCommunity,
        boundaryWall,
        napiPermission,
        minPricePerSqYd,
        maxPricePerSqYd,
        daysOnMarket
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
        should.push({ text: { path: "landType", query: landType } });
        should.push({ text: { path: "plotType", query: landType } });
        should.push({ text: { path: "title", query: landType } });
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

    // Advanced: Price per Sq Yd range
    if (minPricePerSqYd || maxPricePerSqYd) {
        const range = { path: "pricePerSqYd" };
        if (minPricePerSqYd) range.gte = parseFloat(minPricePerSqYd);
        if (maxPricePerSqYd) range.lte = parseFloat(maxPricePerSqYd);
        filter.push({ range });
    }

    // Advanced: Days on market (translate to createdAt range)
    if (daysOnMarket) {
        const cutoff = new Date(Date.now() - parseInt(daysOnMarket) * 24 * 60 * 60 * 1000);
        filter.push({ range: { path: "createdAt", gte: cutoff } });
    }

    // Advanced: Boolean property features
    if (gatedCommunity === 'true' || gatedCommunity === true) {
        filter.push({ equals: { path: "gatedCommunity", value: true } });
    }
    if (boundaryWall === 'true' || boundaryWall === true) {
        filter.push({ equals: { path: "boundaryWall", value: true } });
    }
    if (napiPermission === 'true' || napiPermission === true) {
        filter.push({ equals: { path: "napiPermission", value: true } });
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
        radius,
        // Advanced filters
        gatedCommunity,
        boundaryWall,
        napiPermission,
        minPricePerSqYd,
        maxPricePerSqYd,
        daysOnMarket
    } = params;

    const query = {};

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { location: { $regex: search, $options: 'i' } },
            { city: { $regex: search, $options: 'i' } },
            { locality: { $regex: search, $options: 'i' } },
            { areaName: { $regex: search, $options: 'i' } },
            { plotNumber: { $regex: search, $options: 'i' } }
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

    if (city) {
        const cityRegex = new RegExp(city, 'i');
        if (!query.$or) {
            query.$or = [
                { city: cityRegex },
                { location: cityRegex },
                { areaName: cityRegex },
                { locality: cityRegex }
            ];
        } else {
            query.city = cityRegex;
        }
    }
    if (locality) {
        const locRegex = new RegExp(locality, 'i');
        if (!query.$or) {
            query.$or = [
                { locality: locRegex },
                { location: locRegex },
                { areaName: locRegex }
            ];
        }
    }
    if (propertyType) query.propertyType = propertyType;
    if (plotType && plotType !== 'None') query.plotType = plotType;

    // Smart & Broad Category Matching for landType
    if (landType && landType !== 'None') {
        const categoryConditions = [
            { landType: landType },
            { plotType: landType }
        ];

        if (landType === 'Residential') {
            categoryConditions.push({ propertyType: 'Plot' });
            categoryConditions.push({ title: { $regex: 'residential|plot|housing|villa|sanand|bopal|shela', $options: 'i' } });
        } else if (landType === 'Agricultural') {
            categoryConditions.push({ isAgricultural: true });
            categoryConditions.push({ propertyType: 'Land' });
            categoryConditions.push({ title: { $regex: 'agricultural|farm|kheti|land|acre|bigha', $options: 'i' } });
        } else if (landType === 'Commercial') {
            categoryConditions.push({ title: { $regex: 'commercial|shop|office|retail|highway|frontage', $options: 'i' } });
        } else if (landType === 'Industrial') {
            categoryConditions.push({ title: { $regex: 'industrial|gidc|factory|warehouse|plant', $options: 'i' } });
        } else if (landType === 'Other') {
            categoryConditions.push({ landType: 'None' });
            categoryConditions.push({ plotType: 'None' });
            categoryConditions.push({ landType: '' });
            categoryConditions.push({ landType: { $exists: false } });
            categoryConditions.push({
                landType: { $nin: ['Residential', 'Commercial', 'Industrial', 'Agricultural'] },
                plotType: { $nin: ['Residential', 'Commercial', 'Industrial', 'Agricultural'] }
            });
        }

        if (query.$or) {
            query.$and = [
                { $or: query.$or },
                { $or: categoryConditions }
            ];
            delete query.$or;
        } else {
            query.$or = categoryConditions;
        }
    }

    if (ownerType) query.ownerType = ownerType;
    if (listingType) query.listingType = listingType;

    // 2-Day (48-hour) public visibility window for Sold properties:
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    if (!status || status === 'Active') {
        const statusCondition = {
            $or: [
                { status: 'Active' },
                { status: 'Sold', soldAt: { $gte: twoDaysAgo } }
            ]
        };
        if (query.$or) {
            query.$and = [
                { $or: query.$or },
                statusCondition
            ];
            delete query.$or;
        } else {
            query.$or = statusCondition.$or;
        }
    } else if (status === 'Sold') {
        query.status = 'Sold';
        query.soldAt = { $gte: twoDaysAgo };
    } else {
        query.status = status;
    }

    if (isFeatured !== undefined && isFeatured !== '') {
        query.isFeatured = isFeatured === 'true' || isFeatured === true;
    }
    if (roadTouch !== undefined && roadTouch !== '') {
        query.roadTouch = roadTouch === 'true' || roadTouch === true;
    }
    if (cornerPlot !== undefined && cornerPlot !== '') {
        query.cornerPlot = cornerPlot === 'true' || cornerPlot === true;
    }
    
    if (isAgricultural !== undefined && isAgricultural !== '') {
        query.isAgricultural = isAgricultural === 'true' || isAgricultural === true;
    }

    if (isTokened !== undefined && isTokened !== '') {
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

    // Advanced: Price per Sq Yd range
    if (minPricePerSqYd || maxPricePerSqYd) {
        query.pricePerSqYd = {};
        if (minPricePerSqYd) query.pricePerSqYd.$gte = Number(minPricePerSqYd);
        if (maxPricePerSqYd) query.pricePerSqYd.$lte = Number(maxPricePerSqYd);
    }

    // Advanced: Days on market
    if (daysOnMarket) {
        const cutoff = new Date(Date.now() - parseInt(daysOnMarket) * 24 * 60 * 60 * 1000);
        query.createdAt = { ...(query.createdAt || {}), $gte: cutoff };
    }

    // Advanced: Boolean property features
    if (gatedCommunity === 'true' || gatedCommunity === true) {
        query.gatedCommunity = true;
    }
    if (boundaryWall === 'true' || boundaryWall === true) {
        query.boundaryWall = true;
    }
    if (napiPermission === 'true' || napiPermission === true) {
        query.napiPermission = true;
    }

    return query;
};

/**
 * Executes property search using Atlas Search ($search) with Mongoose Aggregation fallback.
 */
exports.searchProperties = async (params) => {
    const page = parseInt(params.page, 10) || 1;
    const limit = parseInt(params.limit, 10) || 12;
    const skip = (page - 1) * limit;
    const sortField = params.sort || 'recommended';

    let sortStage = { createdAt: -1 };
    if (sortField === 'price_asc') sortStage = { price: 1 };
    if (sortField === 'price_desc') sortStage = { price: -1 };
    if (sortField === 'newest') sortStage = { createdAt: -1 };
    if (sortField === 'views') sortStage = { viewsCount: -1 };

    try {
        // Build fallback query
        const matchQuery = buildFallbackMatchQuery(params);
        
        const total = await Listing.countDocuments(matchQuery);
        const listings = await Listing.find(matchQuery)
            .populate('createdBy', 'name phone role profileImage')
            .sort(sortStage)
            .skip(skip)
            .limit(limit)
            .lean();

        // Attach user property matching createdBy for frontend compatibility
        const formattedListings = listings.map(item => ({
            ...item,
            user: item.user || item.createdBy
        }));

        return {
            success: true,
            count: formattedListings.length,
            total,
            page,
            pages: Math.ceil(total / limit) || 1,
            data: formattedListings
        };
    } catch (error) {
        console.error('Error in searchProperties:', error);
        throw error;
    }
};

/**
 * Auto-suggest search service for autocomplete inputs.
 */
const getSearchSuggestions = async (queryStr) => {
    if (!queryStr || queryStr.trim().length < 2) return [];

    try {
        const regex = new RegExp(queryStr.trim(), 'i');
        const listings = await Listing.find({
            status: { $ne: 'Inactive' },
            isTokened: { $ne: true },
            $or: [
                { title: regex },
                { location: regex },
                { city: regex },
                { locality: regex },
                { areaName: regex },
                { plotNumber: regex }
            ]
        })
        .select('_id title location city locality areaName landType propertyType')
        .limit(8)
        .lean();

        const results = [];
        const seenTexts = new Set();

        listings.forEach(item => {
            if (item.city && item.city.match(regex) && !seenTexts.has(item.city.toLowerCase())) {
                seenTexts.add(item.city.toLowerCase());
                results.push({ text: item.city, type: 'city' });
            }
            if (item.locality && item.locality.match(regex) && !seenTexts.has(item.locality.toLowerCase())) {
                seenTexts.add(item.locality.toLowerCase());
                results.push({ text: `${item.locality}, ${item.city || 'Gujarat'}`, type: 'locality' });
            }
            if (item.title && item.title.match(regex) && !seenTexts.has(item.title.toLowerCase())) {
                seenTexts.add(item.title.toLowerCase());
                results.push({ text: item.title, type: 'listing', id: item._id });
            }
            if (item.location && item.location.match(regex) && !seenTexts.has(item.location.toLowerCase())) {
                seenTexts.add(item.location.toLowerCase());
                results.push({ text: item.location, type: 'location' });
            }
        });

        return results.slice(0, 8);
    } catch (err) {
        console.error('Error in getSearchSuggestions:', err);
        return [];
    }
};

exports.getSuggestions = getSearchSuggestions;
exports.getSearchSuggestions = getSearchSuggestions;
