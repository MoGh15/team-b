const mongoose = require('mongoose');

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGO_URI or MONGODB_URI environment variable is required');
  }

  // Keep trying until MongoDB becomes available
  while (true) {
    try {
      const connection = await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      console.log(`✓ MongoDB connected: ${connection.connection.host}`);
      return connection;
    } catch (error) {
      console.error('MongoDB connection failed, retrying in 3s...', error.message);
      // wait 3 seconds before retrying
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
};

module.exports = connectDB;
