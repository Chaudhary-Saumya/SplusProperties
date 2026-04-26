const Listing = require('../models/Listing');
const asyncHandler = require('../middlewares/async');

// @desc    Get sitemap.xml
// @route   GET /sitemap.xml
// @access  Public
exports.getSitemap = asyncHandler(async (req, res, next) => {
    const listings = await Listing.find({ status: 'Active' }).select('slug location updatedAt');
    
    // Fallback domain if FRONTEND_URL is not set
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    // Add Static Pages
    const staticPages = ['', '/about', '/search', '/area-converter', '/boundary-map'];
    staticPages.forEach(page => {
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}${page}</loc>\n`;
        xml += `    <changefreq>daily</changefreq>\n`;
        xml += `  </url>\n`;
    });
    
    // Add Dynamic Listing Pages
    listings.forEach(listing => {
        if (listing.slug) {
            xml += `  <url>\n`;
            xml += `    <loc>${baseUrl}/land/${listing.location.toLowerCase().replace(/ /g, '-')}/${listing.slug}</loc>\n`;
            xml += `    <lastmod>${listing.updatedAt.toISOString().split('T')[0]}</lastmod>\n`;
            xml += `    <changefreq>weekly</changefreq>\n`;
            xml += `  </url>\n`;
        }
    });
    
    xml += `</urlset>`;
    
    res.header('Content-Type', 'application/xml');
    res.send(xml);
});

// @desc    Get robots.txt
// @route   GET /robots.txt
// @access  Public
exports.getRobots = (req, res) => {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    let robots = `User-agent: *\n`;
    robots += `Allow: /\n`;
    robots += `Disallow: /admin\n`;
    robots += `Disallow: /dashboard\n`;
    robots += `\nSitemap: ${baseUrl}/sitemap.xml`;
    
    res.header('Content-Type', 'text/plain');
    res.send(robots);
};
