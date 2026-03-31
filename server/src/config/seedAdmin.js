const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@attendancecrm.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';
  const adminName = process.env.ADMIN_NAME || 'Super Admin';

  const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
  if (existingAdmin) {
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await User.create({
    name: adminName,
    email: adminEmail.toLowerCase(),
    passwordHash,
    role: 'admin',
  });

  console.log(`✅ Seeded admin user: ${adminEmail}`);
}

module.exports = seedAdmin;
