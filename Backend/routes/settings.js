const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const asyncHandler = require('../middlewares/async');

// @desc    Get public system settings
// @route   GET /api/settings
// @access  Public
router.get('/', asyncHandler(async (req, res, next) => {
    const settings = await Setting.find();
    
    // Map settings to a cleaner object for the frontend
    const publicSettings = {};
    settings.forEach(s => {
        publicSettings[s.key] = s.value;
    });

    res.status(200).json({
        success: true,
        data: publicSettings
    });
}));

module.exports = router;
