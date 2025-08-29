const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Connection options for better resilience
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      maxPoolSize: 10, // Maintain up to 10 socket connections
      retryWrites: true, // Retry write operations on connection errors
      retryReads: true // Retry read operations on connection errors
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection errors after initial connection
    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err.message}`);
    });
    
    // Handle when connection is disconnected
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });
    
    // Handle when connection is reconnected
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
    
    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Don't exit the process immediately, allow for retry logic
    if (process.env.NODE_ENV === 'production') {
      console.error('Failed to connect to MongoDB. Retrying in 5 seconds...');
      setTimeout(() => connectDB(), 5000);
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
