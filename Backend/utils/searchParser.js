/**
 * Helper utility to parse semantic search queries (e.g., "Ahmedabad plot under 50 lakh")
 * and extract structured filters.
 */
exports.parseSearchQuery = (searchQuery) => {
    if (!searchQuery) return {};

    const cleanQuery = searchQuery.toLowerCase().trim();
    const result = {
        originalQuery: searchQuery,
        extractedFilters: {}
    };

    // 1. Budget extraction
    // Regex matches e.g. "under 50 lakh", "below 1.5 crore", "under 10L", "below 2 cr"
    const lakhRegex = /(?:under|below|less\s+than|max|upto)?\s*([\d.]+)\s*(?:lakh|lac|l)\b/;
    const croreRegex = /(?:under|below|less\s+than|max|upto)?\s*([\d.]+)\s*(?:crore|cr)\b/;
    const simpleNumericPriceRegex = /(?:under|below|less\s+than|max|upto)\s*([\d,]+)\b/;

    if (croreRegex.test(cleanQuery)) {
        const match = cleanQuery.match(croreRegex);
        if (match && match[1]) {
            result.extractedFilters.maxPrice = parseFloat(match[1]) * 10000000;
        }
    } else if (lakhRegex.test(cleanQuery)) {
        const match = cleanQuery.match(lakhRegex);
        if (match && match[1]) {
            result.extractedFilters.maxPrice = parseFloat(match[1]) * 100000;
        }
    } else if (simpleNumericPriceRegex.test(cleanQuery)) {
        const match = cleanQuery.match(simpleNumericPriceRegex);
        if (match && match[1]) {
            const rawVal = parseFloat(match[1].replace(/,/g, ''));
            // If it looks like a raw lakh number (e.g. 50 -> 5,000,000)
            if (rawVal < 1000) {
                result.extractedFilters.maxPrice = rawVal * 100000;
            } else {
                result.extractedFilters.maxPrice = rawVal;
            }
        }
    }

    // Min price match (e.g. "above 10 lakh", "more than 1 cr")
    const minLakhRegex = /(?:above|more\s+than|min|starting)?\s*([\d.]+)\s*(?:lakh|lac|l)\b/;
    const minCroreRegex = /(?:above|more\s+than|min|starting)?\s*([\d.]+)\s*(?:crore|cr)\b/;
    if (minCroreRegex.test(cleanQuery)) {
        const match = cleanQuery.match(minCroreRegex);
        if (match && match[1]) {
            result.extractedFilters.minPrice = parseFloat(match[1]) * 10000000;
        }
    } else if (minLakhRegex.test(cleanQuery)) {
        const match = cleanQuery.match(minLakhRegex);
        if (match && match[1]) {
            result.extractedFilters.minPrice = parseFloat(match[1]) * 100000;
        }
    }

    // 2. Land/Plot Type extraction
    if (cleanQuery.includes('agricultural') || cleanQuery.includes('agriculture') || cleanQuery.includes('farm') || cleanQuery.includes('kheti')) {
        result.extractedFilters.plotType = 'Agricultural';
        result.extractedFilters.landType = 'Agricultural';
    } else if (cleanQuery.includes('commercial') || cleanQuery.includes('shop') || cleanQuery.includes('office') || cleanQuery.includes('dukan')) {
        result.extractedFilters.plotType = 'Commercial';
        result.extractedFilters.landType = 'Commercial';
    } else if (cleanQuery.includes('industrial') || cleanQuery.includes('factory') || cleanQuery.includes('karkhana')) {
        result.extractedFilters.plotType = 'Industrial';
        result.extractedFilters.landType = 'Industrial';
    } else if (cleanQuery.includes('residential') || cleanQuery.includes('non-agricultural') || cleanQuery.includes('na plot') || cleanQuery.includes('home') || cleanQuery.includes('house')) {
        result.extractedFilters.plotType = 'Residential';
        result.extractedFilters.landType = 'Non-Agricultural';
    }

    // 3. Area size extraction
    // Regex matches e.g. "above 500 sq ft", "100 gaj", "2 acre"
    const sqftRegex = /([\d.]+)\s*(?:sqft|sq\s*ft|square\s*feet)\b/;
    const gajRegex = /([\d.]+)\s*(?:gaj|guz|yard|vaar)\b/;
    const acreRegex = /([\d.]+)\s*(?:acre|ac)\b/;

    if (sqftRegex.test(cleanQuery)) {
        const match = cleanQuery.match(sqftRegex);
        if (match && match[1]) {
            result.extractedFilters.minArea = parseFloat(match[1]);
        }
    } else if (gajRegex.test(cleanQuery)) {
        const match = cleanQuery.match(gajRegex);
        if (match && match[1]) {
            result.extractedFilters.minArea = parseFloat(match[1]) * 9; // Approx conversion to Sq Ft for consistency
        }
    } else if (acreRegex.test(cleanQuery)) {
        const match = cleanQuery.match(acreRegex);
        if (match && match[1]) {
            result.extractedFilters.minArea = parseFloat(match[1]) * 43560; // Acres to Sq Ft
        }
    }

    // 4. City/Location Extraction
    // Strip numeric values, unit words, and standard query noise to find location candidate
    const noiseWords = [
        'under', 'below', 'above', 'more', 'less', 'than', 'lakh', 'lac', 'crore', 'cr', 'plot',
        'land', 'agricultural', 'industrial', 'commercial', 'residential', 'na', 'for', 'sale',
        'buy', 'gaj', 'sqft', 'sq', 'ft', 'acre', 'budget', 'l', 'price', 'in', 'at', 'near'
    ];

    let queryWords = cleanQuery.split(/\s+/);
    // Filter out words that are numeric or noise
    let locationWords = queryWords.filter(word => {
        if (noiseWords.includes(word)) return false;
        if (/^\d+/.test(word)) return false;
        return true;
    });

    if (locationWords.length > 0) {
        // Capitalize the first location word candidate
        const candidate = locationWords[0];
        result.extractedFilters.location = candidate.charAt(0).toUpperCase() + candidate.slice(1);
    }

    return result.extractedFilters;
};
