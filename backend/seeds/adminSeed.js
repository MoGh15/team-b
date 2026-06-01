require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

/**
 * Connect to MongoDB and seed admin user
 */
const seedAdmin = async () => {
  try {
    console.log('🌱 Starting admin seeding process...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

    if (existingAdmin) {
      console.log(`ℹ Admin user with email "${ADMIN_EMAIL}" already exists.`);
      console.log('✓ Seeding skipped.');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Create default admin user
    const adminUser = new User({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'Admin'
    });

    await adminUser.save();
    console.log(`✓ Default admin user created successfully!`);
    console.log(`  Email: ${ADMIN_EMAIL}`);
    console.log(`  Role: Admin`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
    console.log('🎉 Seeding completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    console.error(error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

// Execute seeding
seedAdmin();
