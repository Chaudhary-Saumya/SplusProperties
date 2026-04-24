const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const Listing = require('../models/Listing');

mongoose.connect(process.env.MONGODB_URI);

const syncIndexes = async () => {
    try {
        console.log('Ensuring indexes...');
        await Listing.createIndexes();
        console.log('Indexes built successfully.');
        const indexes = await Listing.collection.getIndexes();
        console.log('Current Indexes:', JSON.stringify(indexes, null, 2));
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

syncIndexes();
