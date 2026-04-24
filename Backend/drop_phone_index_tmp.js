const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../Backend/.env') });

const dropIndex = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB:', process.env.MONGODB_URI);
        
        const db = mongoose.connection.db;
        const collection = db.collection('users');
        
        // Try to drop the phone_1 index
        try {
            await collection.dropIndex('phone_1');
            console.log('Successfully dropped phone_1 index');
        } catch (err) {
            if (err.code === 27 || err.message.includes('index not found')) {
                console.log('phone_1 index not found (already dropped or never existed)');
            } else {
                throw err;
            }
        }
        
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

dropIndex();
