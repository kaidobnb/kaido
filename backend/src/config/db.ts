import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    console.log('Connecting to MongoDB with URI:', process.env.MONGODB_URI);
    const conn = await mongoose.connect(process.env.MONGODB_URI as string);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log('MongoDB Database Name:', conn.connection.db?.databaseName || 'unknown');

    // List all collections
    const collections = conn.connection.db ?
      await conn.connection.db.listCollections().toArray() :
      [];
    console.log('Available collections:', collections.map(c => c.name));
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error}`);
    process.exit(1);
  }
};

export default connectDB;
