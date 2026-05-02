const MapConfig = require('../models/MapConfig');

// @desc    Save a new map configuration
// @route   POST /api/maps
// @access  Private
exports.saveMap = async (req, res) => {
    try {
        if (req.user) {
            req.body.createdBy = req.user.id;
            req.body.expiresAt = null; // Permanent
        } else {
            // Guest map expires in 24 hours
            req.body.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            req.body.createdBy = null;
        }
        
        let map;
        if (req.body.shareId) {
            // Check if map exists and user is owner
            map = await MapConfig.findOne({ shareId: req.body.shareId });
            if (map) {
                if (map.createdBy && map.createdBy.toString() !== req.user?.id) {
                    return res.status(401).json({ success: false, error: 'Unauthorized to update this map' });
                }
                Object.assign(map, req.body);
                await map.save();
            } else {
                map = await MapConfig.create(req.body);
            }
        } else {
            map = await MapConfig.create(req.body);
        }
        
        res.status(201).json({
            success: true,
            data: map
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Get map by shareId
// @route   GET /api/maps/:shareId
// @access  Public
exports.getMap = async (req, res) => {
    try {
        const map = await MapConfig.findOne({ shareId: req.params.shareId })
            .populate('listingId', 'title location price');

        if (!map) {
            return res.status(404).json({
                success: false,
                error: 'Map not found'
            });
        }

        res.status(200).json({
            success: true,
            data: map
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Get all maps created by user
// @route   GET /api/maps/my-maps
// @access  Private
exports.getMyMaps = async (req, res) => {
    try {
        const maps = await MapConfig.find({ createdBy: req.user.id }).sort('-createdAt');
        
        res.status(200).json({
            success: true,
            count: maps.length,
            data: maps
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};
// @desc    Delete map
// @route   DELETE /api/maps/:shareId
// @access  Private
exports.deleteMap = async (req, res) => {
    try {
        const map = await MapConfig.findOne({ shareId: req.params.shareId });

        if (!map) {
            return res.status(404).json({
                success: false,
                error: 'Map not found'
            });
        }

        // Check ownership
        if (map.createdBy && map.createdBy.toString() !== req.user.id && req.user.role !== 'Admin') {
            return res.status(401).json({
                success: false,
                error: 'Not authorized to delete this map'
            });
        }

        await map.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};
