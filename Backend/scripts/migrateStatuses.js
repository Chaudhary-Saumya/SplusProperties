const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const Listing = require('../models/Listing');

const migrateStatuses = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected for migration...');

        // Update all listings that have non-binary statuses
        const result = await Listing.updateMany(
            { status: { $in: ['Verified', 'PendingVerification', 'Rejected', 'Reserved'] } },
            { $set: { status: 'Active', listingType: 'Verified' } } 
        );

        console.log(`${result.modifiedCount} listings migrated to 'Active' status.`);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

migrateStatuses();
