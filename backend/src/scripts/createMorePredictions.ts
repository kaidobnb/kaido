import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { autoPredictionJob } from '../jobs/autoPredictionJob';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kaido');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

const createMorePredictions = async () => {
  try {
    await connectDB();
    
    console.log('Manually triggering auto-prediction creation...');
    
    // Manually fire the auto-prediction job
    await autoPredictionJob.fireOnTick();
    
    console.log('Auto-prediction creation completed!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

// Run the script
createMorePredictions();
