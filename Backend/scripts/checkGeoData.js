const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const Listing = require('../models/Listing');

mongoose.connect(process.env.MONGODB_URI);

const checkData = async () => {
    try {
        const listings = await Listing.find({}).limit(5);
        console.log('Sample Listings Data:');
        listings.forEach(l => {
            console.log(`Title: ${l.title}`);
            console.log(`Status: ${l.status}`);
            console.log(`Type: ${l.listingType}`);
            console.log(`MapCoords: ${JSON.stringify(l.mapCoordinates)}`);
            console.log(`GeoJSON: ${JSON.stringify(l.geoSpatialLocation)}`);
            console.log('---');
        });
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkData();
