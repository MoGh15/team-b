require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_NAME = 'admin';

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

    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL }).select('+password');

    if (existingAdmin) {
      existingAdmin.name = ADMIN_NAME;
      existingAdmin.fullName = ADMIN_NAME;
      existingAdmin.password = ADMIN_PASSWORD;
      existingAdmin.role = 'admin';
      existingAdmin.status = 'active';
      existingAdmin.isActive = true;
      await existingAdmin.save();
      console.log(`✓ Default admin user refreshed successfully!`);
    } else {
      const adminUser = new User({
        name: ADMIN_NAME,
        fullName: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin',
        status: 'active',
        isActive: true
      });

      await adminUser.save();
      console.log(`✓ Default admin user created successfully!`);
    }

    console.log(`  Email: ${ADMIN_EMAIL}`);
    console.log(`  Username: ${ADMIN_NAME}`);
    console.log(`  Role: admin`);

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
