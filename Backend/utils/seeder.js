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
        const settingsCount = await Setting.countDocuments();
        if (settingsCount === 0) {
            console.log('No settings found! Seeding defaults...');
            await Setting.create({
                key: 'isInstantBookingEnabled',
                value: true,
                description: 'Enable or disable global Instant Token Booking functionality.'
            });
            console.log('Default settings seeded.');
        }
    } catch (err) {
        console.error('Error auto-seeding database:', err);
    }
};

module.exports = autoSeed;
