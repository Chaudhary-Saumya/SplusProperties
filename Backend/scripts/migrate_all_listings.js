const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/PropertySelling';
console.log('Connecting to:', dbUrl);

const parseLocation = (loc) => {
    if (!loc) return { city: '', locality: '' };
    const parts = loc.split(',').map(p => p.trim());
    let city = '';
    let locality = '';
    
    for (const p of parts) {
        const lower = p.toLowerCase();
        if (lower.includes('ahmedabad')) {
            city = 'Ahmedabad';
        } else if (lower.includes('gandhinagar')) {
            city = 'Gandhinagar';
        } else if (lower.includes('palanpur')) {
            city = 'Palanpur';
        } else if (lower.includes('mehsana')) {
            city = 'Mehsana';
        } else if (lower.includes('kalol')) {
            city = 'Kalol';
        } else if (lower.includes('bopal')) {
            city = 'Ahmedabad';
            locality = 'Bopal';
        } else if (lower.includes('sargasan')) {
            city = 'Gandhinagar';
            locality = 'Sargasan';
        } else if (lower.includes('adalaj')) {
            city = 'Gandhinagar';
            locality = 'Adalaj';
        } else if (lower.includes('kanodar')) {
            city = 'Palanpur';
            locality = 'Kanodar';
        }
    }
    
    if (!city && parts.length > 2) {
        const talukaPart = parts.find(p => p.toLowerCase().includes('taluka'));
        if (talukaPart) {
            city = talukaPart.replace(/taluka/i, '').trim();
        } else {
            city = parts[parts.length - 3] || parts[0];
        }
    }
    if (!locality && parts.length > 0) {
        locality = parts[0];
    }
    
    return { city, locality };
};

mongoose.connect(dbUrl)
    .then(async () => {
        console.log('Connected successfully!');
        const listings = await mongoose.connection.db.collection('listings').find({}).toArray();
        console.log(`Total listings to inspect/migrate: ${listings.length}`);

        for (const l of listings) {
            let updates = {};

            // 1. Determine propertyType
            let propType = l.propertyType;
            let plotType = l.plotType || 'None';
            let landType = l.landType || 'None';

            if (!propType) {
                // Guess from title or location
                const textLower = ((l.title || '') + ' ' + (l.location || '')).toLowerCase();
                if (textLower.includes('land')) {
                    propType = 'Land';
                } else {
                    propType = 'Plot';
                }
            } else if (propType === 'Residential Plot') {
                propType = 'Plot';
                plotType = 'Residential';
            } else if (propType === 'Commercial Plot') {
                propType = 'Plot';
                plotType = 'Commercial';
            } else if (propType === 'Agricultural Land') {
                propType = 'Land';
                landType = 'Agricultural';
            } else if (propType === 'Industrial Plot') {
                propType = 'Plot';
                plotType = 'Industrial';
            } else if (propType === 'Agricultural Plot') {
                propType = 'Plot';
                plotType = 'Agricultural';
            }

            if (propType !== 'Plot' && propType !== 'Land') {
                propType = 'Plot';
            }

            updates.propertyType = propType;
            updates.plotType = plotType;
            updates.landType = landType;

            // 2. Parse numericArea
            let numArea = l.numericArea;
            if (numArea === undefined || numArea === 0 || isNaN(numArea)) {
                if (l.area) {
                    const match = l.area.match(/([\d.,]+)/);
                    if (match) {
                        numArea = parseFloat(match[1].replace(/,/g, '')) || 0;
                    } else {
                        numArea = 0;
                    }
                } else {
                    numArea = 0;
                }
            }
            updates.numericArea = numArea;

            // 3. Extract city & locality
            let cityVal = l.city;
            let localityVal = l.locality;
            if (!cityVal || !localityVal) {
                const parsed = parseLocation(l.location);
                updates.city = cityVal || parsed.city;
                updates.locality = localityVal || parsed.locality;
            }

            // 4. Default boolean attributes
            updates.roadTouch = l.roadTouch !== undefined ? l.roadTouch : false;
            updates.cornerPlot = l.cornerPlot !== undefined ? l.cornerPlot : false;
            updates.isFeatured = l.isFeatured !== undefined ? l.isFeatured : false;

            // Agricultural boolean programmatically mapped
            if (l.isAgricultural !== undefined) {
                updates.isAgricultural = l.isAgricultural;
            } else {
                updates.isAgricultural = propType === 'Land' 
                    ? (landType === 'Agricultural')
                    : (plotType === 'Agricultural');
            }

            // 5. Default ownerType
            if (!l.ownerType) {
                updates.ownerType = 'Owner'; // default to Owner
            }

            console.log(`Migrating ID ${l._id} (${l.title}) -> propertyType: ${updates.propertyType}, plotType: ${updates.plotType}, landType: ${updates.landType}, numericArea: ${updates.numericArea}, city: ${updates.city}, locality: ${updates.locality}`);
            
            await mongoose.connection.db.collection('listings').updateOne(
                { _id: l._id },
                { $set: updates }
            );
        }

        console.log('Migration completed successfully!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Error connecting to database:', err);
        process.exit(1);
    });
