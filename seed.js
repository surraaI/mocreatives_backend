require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const createSuperAdmin = async () => {
  try {
    // Connect to DB
    await mongoose.connect(process.env.MONGODB_URI);

    // Check if SuperAdmin already exists
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperAdmin) {
      console.log('SuperAdmin already exists:', existingSuperAdmin.email);
      process.exit();
    }

    // Create SuperAdmin
   // Modify the superAdmin creation:
    tempPassword = 'TempPassword123!';
    const superAdmin = await User.create({
        name: 'MoCreatives SuperAdmin',
        email: process.env.SUPERADMIN_EMAIL || 'superadmin@mocreatives.com',
        password: await bcrypt.hash(
        tempPassword,
        12
        ),
        role: 'superadmin',
        linkedinLink: 'https://linkedin.com/in/mocreatives-superadmin',
        profilePhoto: 'https://linkedin.com/in/mocreatives-superadmin'


    });


    console.log('SuperAdmin created successfully:');
    console.log(`Email: ${superAdmin.email}`);
    console.log(`Password: ${tempPassword}`);
    process.exit();
  } catch (error) {
    console.error('Error creating SuperAdmin:', error.message);
    process.exit(1);
  }
};

createSuperAdmin();