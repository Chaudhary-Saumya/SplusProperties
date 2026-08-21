const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const createFreshAdmin = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        console.log('Connecting to MongoDB Atlas Cluster...');
        await mongoose.connect(mongoUri);
        console.log('Connected to DB:', mongoose.connection.db.databaseName);

        const email = 'superadmin@kharsan.com';
        const password = 'Admin123456';
        const phone = '9876543210';
        const name = 'Super Admin';

        // Delete any existing user with this email or phone to ensure clean state
        await User.deleteMany({ $or: [{ email: email }, { phone: phone }] });

        // Pass plain password so pre-save hook handles hashing properly once!
        const newAdmin = new User({
            name,
            email,
            phone,
            password,
            role: 'Admin',
            isVerified: true,
            accountStatus: 'Active'
        });

        await newAdmin.save();

        console.log('✅ Fresh Admin Created Successfully!');

        // Test login hash verification
        const userInDb = await User.findOne({ email }).select('+password');
        const isMatch = await bcrypt.compare(password, userInDb.password);

        if (isMatch) {
            console.log('🎉 BCRYPT PASSWORD TEST PASSED 100%! Ready to login!');
        } else {
            console.error('❌ Password hash mismatch!');
        }

        console.log('\n=======================================');
        console.log('👑 NEW ADMIN CREDENTIALS:');
        console.log(`Email:    ${email}`);
        console.log(`Password: ${password}`);
        console.log(`Phone:    ${phone}`);
        console.log(`Role:     ${userInDb.role}`);
        console.log('=======================================\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error creating fresh admin:', err);
        process.exit(1);
    }
};

createFreshAdmin();
