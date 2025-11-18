import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Prediction from '../models/Prediction';
import AdminSettings from '../models/AdminSettings';

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

const checkPredictions = async () => {
  try {
    await connectDB();
    
    console.log('Checking current prediction status...\n');
    
    // Get admin settings
    const adminSettings = await AdminSettings.findOne({});
    console.log('Auto-prediction settings:');
    console.log(`- Enabled: ${adminSettings?.autoPredictionEnabled || false}`);
    console.log(`- Max Active: ${adminSettings?.maxActivePredictions || 20}`);
    console.log(`- Per Batch: ${adminSettings?.predictionsPerBatch || 3}`);
    console.log(`- Interval: ${adminSettings?.autoPredictionInterval || '0 */6 * * *'}\n`);
    
    // Get prediction counts
    const totalPredictions = await Prediction.countDocuments({});
    const activePredictions = await Prediction.countDocuments({ status: 'active' });
    const resolvedPredictions = await Prediction.countDocuments({ status: 'resolved' });
    
    console.log('Prediction counts:');
    console.log(`- Total: ${totalPredictions}`);
    console.log(`- Active: ${activePredictions}`);
    console.log(`- Resolved: ${resolvedPredictions}\n`);
    
    // Get recent predictions
    const recentPredictions = await Prediction.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title asset targetPrice endDate createdAt');
    
    console.log('Recent active predictions:');
    recentPredictions.forEach((pred, index) => {
      console.log(`${index + 1}. ${pred.title}`);
      console.log(`   Asset: ${pred.asset}, Target: $${pred.targetPrice}`);
      console.log(`   Expires: ${new Date(pred.endDate).toLocaleDateString()}`);
      console.log(`   Created: ${new Date(pred.createdAt).toLocaleString()}\n`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

// Run the script
checkPredictions();
