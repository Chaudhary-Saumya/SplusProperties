const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const Listing = require('../models/Listing');

// Connect to DB
mongoose.connect(process.env.MONGODB_URI);

const patchDB = async () => {
    try {
        console.log('Connecting and starting GeoSpatial DB Patch...');
        const listings = await Listing.find({});
        let updated = 0;

        for (let l of listings) {
            if (l.mapCoordinates && l.mapCoordinates.lat && l.mapCoordinates.lng) {
                l.geoSpatialLocation = {
                    type: 'Point',
                    coordinates: [parseFloat(l.mapCoordinates.lng), parseFloat(l.mapCoordinates.lat)]
                };
                await l.save({ validateBeforeSave: false }); // Bypass validation intentionally for legacy docs
                updated++;
            }
        }
        
        console.log(`Successfully mapped ${updated} properties to GeoSpatial Arrays.`);
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

patchDB();
