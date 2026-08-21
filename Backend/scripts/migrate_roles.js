const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const migrateRoles = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        console.log('Connecting to MongoDB Atlas Cluster...');
        await mongoose.connect(mongoUri);
        console.log('Connected to DB:', mongoose.connection.db.databaseName);

        const legacyUsers = await User.find({ role: { $in: ['Buyer', 'Seller'] } });
        console.log(`Found ${legacyUsers.length} legacy Buyer/Seller account(s) to migrate.`);

        if (legacyUsers.length > 0) {
            const res = await User.updateMany(
                { role: { $in: ['Buyer', 'Seller'] } },
                { $set: { role: 'User' } }
            );
            console.log(`✅ Successfully updated ${res.modifiedCount} user(s) to standard 'User' role!`);
        } else {
            console.log('✨ All users are already up-to-date!');
        }

        // Summary of roles count
        const counts = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        console.log('\n=======================================');
        console.log('📊 UPDATED DATABASE ROLES SUMMARY:');
        counts.forEach(c => console.log(`Role: ${c._id.padEnd(10)} | Count: ${c.count}`));
        console.log('=======================================\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error during role migration:', err);
        process.exit(1);
    }
};

migrateRoles();
