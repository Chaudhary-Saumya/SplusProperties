const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const fixAdmins = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Fix admin@kharsan.com
        let admin1 = await User.findOne({ email: 'admin@kharsan.com' });
        if (!admin1) {
            admin1 = new User({ email: 'admin@kharsan.com', name: 'Admin One', phone: '9999999999', role: 'Admin' });
        }
        admin1.password = 'Admin@123';
        admin1.role = 'Admin';
        admin1.isVerified = true;
        admin1.accountStatus = 'Active';
        await admin1.save();
        console.log('✅ admin@kharsan.com fixed & password set to Admin@123!');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fixAdmins();
