import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nocodedb_app';
    
    await mongoose.connect(mongoURI);
    
    // Get the database name from the connection
    const dbName = mongoose.connection.db?.databaseName;
    
    console.log(`✅ MongoDB connected successfully`);
    console.log(`📁 Database: ${dbName}`);
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

export default connectDB;
