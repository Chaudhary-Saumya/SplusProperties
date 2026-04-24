const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const fixIndexes = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/PropertySelling');
    
    const db = mongoose.connection.db;
    const collection = db.collection('users');
    
    console.log('Dropping phone_1 index...');
    try {
      await collection.dropIndex('phone_1');
      console.log('Successfully dropped phone_1 index.');
    } catch (err) {
      if (err.codeName === 'IndexNotFound') {
        console.log('Index phone_1 not found, skipping drop.');
      } else {
        console.error('Error dropping index:', err.message);
      }
    }

    console.log('Indexes currently on collection:');
    const indexes = await collection.indexes();
    console.log(indexes);

    console.log('Done. Restart the server to let Mongoose recreate the sparse index.');
    process.exit(0);
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

fixIndexes();
