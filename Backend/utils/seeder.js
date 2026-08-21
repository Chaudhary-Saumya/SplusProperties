const User = require('../models/User');
const Setting = require('../models/Setting');

const autoSeed = async () => {
    try {
        // Check for settings
        const hasInstant = await Setting.findOne({ key: 'isInstantBookingEnabled' });
        if (!hasInstant) {
            console.log('Seeding isInstantBookingEnabled...');
            await Setting.create({
                key: 'isInstantBookingEnabled',
                value: true,
                description: 'Enable or disable global Instant Token Booking functionality.'
            });
        }

        const rankingWeights = await Setting.findOne({ key: 'ranking_weights' });
        if (!rankingWeights) {
            console.log('Seeding default ranking weights...');
            await Setting.create({
                key: 'ranking_weights',
                value: {
                    viewsWeight: 1.0,
                    uniqueViewsWeight: 1.5,
                    whatsappClicksWeight: 3.0,
                    phoneClicksWeight: 4.0,
                    favoritesWeight: 5.0,
                    sharesWeight: 2.0,
                    freshnessWeight: 10.0,
                    trustWeight: 8.0,
                    qualityWeight: 12.0,
                    premiumBoost: 20.0,
                    featuredBoost: 15.0,
                    duplicatePenalty: -30.0,
                    spamPenalty: -50.0,
                    decayRate: 0.05
                },
                description: 'Weights configuration for Listing Ranking Engine.'
            });
            console.log('Default ranking weights seeded.');
        }

        // Automatic Railway / Startup Role Standardization Migration
        const legacyCount = await User.countDocuments({ role: { $in: ['Buyer', 'Seller'] } });
        if (legacyCount > 0) {
            console.log(`[MIGRATION] Converting ${legacyCount} legacy Buyer/Seller users to standard 'User' role...`);
            await User.updateMany(
                { role: { $in: ['Buyer', 'Seller'] } },
                { $set: { role: 'User' } }
            );
            console.log('[MIGRATION] ✅ User role migration completed!');
        }
    } catch (err) {
        console.error('Error auto-seeding database:', err);
    }
};

module.exports = autoSeed;
