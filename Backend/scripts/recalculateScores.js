const dotenv = require('dotenv');
const connectDB = require('../config/db');
const { updateAllScores } = require('../services/rankingService');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

const run = async () => {
    try {
        await connectDB();
        const results = await updateAllScores();
        console.log('Batch update completed successfully:', results);
    } catch (err) {
        console.error('Error running batch calculations script:', err);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
};

run();
