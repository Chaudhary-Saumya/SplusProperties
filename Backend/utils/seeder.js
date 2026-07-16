const User = require('../models/User');
const Setting = require('../models/Setting');

const autoSeed = async () => {
    try {
        const count = await User.countDocuments();
        if (count === 0) {
            console.log('No users found in database! Creating 4 default accounts...');
            
            const users = [
                {
                    name: 'Super Admin',
                    email: 'admin@demo.com',
                    password: 'password123',
                    role: 'Admin',
                    phone: '9999999999'
                },
                {
                    name: 'Seller User',
                    email: 'seller@demo.com',
                    password: 'password123',
                    role: 'Seller',
                    phone: '8888888888'
                },
                {
                    name: 'Broker User',
                    email: 'broker@demo.com',
                    password: 'password123',
                    role: 'Broker',
                    phone: '7777777777'
                },
                {
                    name: 'Buyer User',
                    email: 'buyer@demo.com',
                    password: 'password123',
                    role: 'Buyer',
                    phone: '6666666666'
                }
            ];

            await User.create(users);
            console.log('Successfully created admin, seller, broker, and buyer accounts! Check server output.');
        }

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
    } catch (err) {
        console.error('Error auto-seeding database:', err);
    }
};

module.exports = autoSeed;
