require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperAdmin) {
      console.log('SuperAdmin already exists:', existingSuperAdmin.email);
      process.exit();
    }

    const superAdmin = await User.create({
      name: 'MoCreatives SuperAdmin',
      email: process.env.SUPERADMIN_EMAIL || 'superadmin@mocreatives.com',
      password: process.env.SUPERADMIN_EMAIL || 'superadminpsd123456', 
      role: 'superadmin',
      linkedinLink: 'https://linkedin.com/in/mocreatives-superadmin',
      profilePhoto: 'https://linkedin.com/in/mocreatives-superadmin'
    });

    console.log('SuperAdmin created successfully:');
    console.log(`Email: ${superAdmin.email}`);
    console.log(`Temporary Password: ${tempPassword}`); // This is what you'll use to login
    process.exit();
  } catch (error) {
    console.error('Error creating SuperAdmin:', error.message);
    process.exit(1);
  }
};

createSuperAdmin();