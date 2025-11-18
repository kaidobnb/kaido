// Script to drop the unique index on participations collection
// Run this script with: node dropUniqueIndex.js

const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/solymarket';

async function dropUniqueIndex() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Get the participations collection
    const db = mongoose.connection.db;
    const participationsCollection = db.collection('participations');

    // Get all indexes on the collection
    const indexes = await participationsCollection.indexes();
    console.log('Current indexes:', indexes);

    // Find the unique index on user, prediction, position
    const uniqueIndex = indexes.find(index => 
      index.key.user === 1 && 
      index.key.prediction === 1 && 
      index.key.position === 1
    );

    if (uniqueIndex) {
      console.log('Found unique index:', uniqueIndex.name);
      
      // Drop the index
      await participationsCollection.dropIndex(uniqueIndex.name);
      console.log('Successfully dropped the unique index');
      
      // Create a new non-unique index
      await participationsCollection.createIndex(
        { user: 1, prediction: 1, position: 1 },
        { unique: false }
      );
      console.log('Created new non-unique index');
    } else {
      console.log('No unique index found on user, prediction, position');
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
    console.log('Index migration completed successfully');
  } catch (error) {
    console.error('Error dropping unique index:', error);
  }
}

// Run the function
dropUniqueIndex();
