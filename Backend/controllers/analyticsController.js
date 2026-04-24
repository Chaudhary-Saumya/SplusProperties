const PageHit = require('../models/PageHit');
const asyncHandler = require('../middlewares/async');

exports.recordHit = asyncHandler(async (req, res, next) => {
    const { path } = req.body;
    if (!path) return res.status(400).json({ success: false });

    // Ensure only valid app paths or ignore specific ones
    if (path.includes('.')) return res.status(200).json({ success: true }); 

    const date = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    let pageHit = await PageHit.findOne({ path, date });
    if (pageHit) {
        pageHit.hits += 1;
        await pageHit.save();
    } else {
        await PageHit.create({ path, date, hits: 1 });
    }

    res.status(200).json({ success: true });
});
