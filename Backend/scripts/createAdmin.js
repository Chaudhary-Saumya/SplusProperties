const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const run = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database.');

        // 1. List all admin users
        const admins = await User.find({ role: 'Admin' }).select('+password');
        console.log('\n--- Existing Admin Users ---');
        if (admins.length === 0) {
            console.log('No admin users found.');
        } else {
            admins.forEach(admin => {
                console.log(`ID: ${admin._id}`);
                console.log(`Name: ${admin.name}`);
                console.log(`Email: ${admin.email}`);
                console.log(`Phone: ${admin.phone || 'N/A'}`);
                console.log(`Status: ${admin.accountStatus}`);
                console.log('---------------------------');
            });
        }

        const targetEmails = ['admin@splusproperties.com', 'admin@demo.com'];
        const defaultPassword = 'AdminPassword123!';

        for (const email of targetEmails) {
            console.log(`\nProcessing admin user for email "${email}"...`);
            let adminUser = await User.findOne({ email });

            if (adminUser) {
                console.log(`Admin user "${email}" found, resetting password...`);
                adminUser.password = defaultPassword;
                adminUser.role = 'Admin';
                adminUser.accountStatus = 'Active';
                await adminUser.save();
                console.log(`Successfully reset "${email}" password to: ${defaultPassword}`);
            } else {
                console.log(`Creating new admin user for "${email}"...`);
                const defaultPhone = email === 'admin@demo.com' ? '9999999999' : '+19999999999';
                // Check if phone number is already taken
                const phoneExists = await User.findOne({ phone: defaultPhone });
                const phone = phoneExists ? `+1${Math.floor(1000000000 + Math.random() * 9000000000)}` : defaultPhone;
                
                adminUser = new User({
                    name: email === 'admin@demo.com' ? 'Super Admin' : 'System Admin',
                    email: email,
                    password: defaultPassword,
                    phone: phone,
                    role: 'Admin',
                    accountStatus: 'Active',
                    isVerified: true
                });
                await adminUser.save();
                console.log(`Successfully created new Admin User for "${email}"!`);
                console.log(`Email: ${email}`);
                console.log(`Password: ${defaultPassword}`);
                console.log(`Phone: ${phone}`);
            }
        }

        console.log('\nDone!');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

run();
