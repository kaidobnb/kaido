import mongoose from 'mongoose';
import User from '../models/User';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get admin wallet address from environment variables
const ADMIN_WALLET_ADDRESS = process.env.ADMIN_WALLET_ADDRESS;

// Check if admin wallet address is defined
if (!ADMIN_WALLET_ADDRESS) {
  console.error('Error: ADMIN_WALLET_ADDRESS is not defined in environment variables');
  process.exit(1);
}

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/solymarket');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error}`);
    process.exit(1);
  }
};

// Set up admin user
const setupAdmin = async () => {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ walletAddress: ADMIN_WALLET_ADDRESS });

    if (existingAdmin) {
      // Update existing admin user
      const updatedAdmin = await User.findOneAndUpdate(
        { walletAddress: ADMIN_WALLET_ADDRESS },
        {
          isAdmin: true,
          username: 'SolyAdmin',
          email: 'admin@solymarket.ai',
          profileCompleted: true,
          $setOnInsert: {
            balances: {
              SOL: 1000,
              SOLY: 10000
            }
          }
        },
        { new: true, upsert: true }
      );

      console.log('Admin user updated:', updatedAdmin);
    } else {
      // Create new admin user
      const newAdmin = await User.create({
        walletAddress: ADMIN_WALLET_ADDRESS,
        username: 'SolyAdmin',
        email: 'admin@solymarket.ai',
        isAdmin: true,
        profileCompleted: true,
        balances: {
          SOL: 1000,
          SOLY: 10000
        }
      });

      console.log('Admin user created:', newAdmin);
    }

    console.log('Admin setup complete!');
  } catch (error) {
    console.error('Error setting up admin user:', error);
  }
};

// Run the script
const run = async () => {
  const conn = await connectDB();
  await setupAdmin();
  await mongoose.disconnect();
  console.log('Database connection closed');
};

run().catch(console.error);
