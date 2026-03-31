require('dotenv').config();

const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Employee = require('./models/Employee');
const Attendance = require('./models/Attendance');
const Checkin = require('./models/Checkin');
const generateEmployeeCode = require('./utils/generateEmployeeCode');
const { normalizeDate } = require('./utils/dateUtils');

async function seed() {
  await connectDB();

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@attendancecrm.local').toLowerCase();
  let admin = await User.findOne({ email: adminEmail });

  if (!admin) {
    admin = await User.create({
      name: process.env.ADMIN_NAME || 'Super Admin',
      email: adminEmail,
      passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@12345', 10),
      role: 'admin',
    });
  }

  const employeesPayload = [
    {
      fullName: 'Rakesh Kumar',
      department: 'Operations',
      designation: 'Manager',
      email: 'rakesh@example.com',
      phone: '9999999991',
      joinDate: '2025-01-10',
    },
    {
      fullName: 'Sima Das',
      department: 'Service',
      designation: 'Waiter',
      email: 'sima@example.com',
      phone: '9999999992',
      joinDate: '2025-02-03',
    },
    {
      fullName: 'Sangi Rao',
      department: 'Kitchen',
      designation: 'Chef',
      email: 'sangi@example.com',
      phone: '9999999993',
      joinDate: '2025-02-15',
    },
    {
      fullName: 'Soniya Paul',
      department: 'Billing',
      designation: 'Cashier',
      email: 'soniya@example.com',
      phone: '9999999994',
      joinDate: '2025-03-01',
    },
  ];

  const employees = [];
  for (let index = 0; index < employeesPayload.length; index += 1) {
    const payload = employeesPayload[index];
    let employee = await Employee.findOne({ email: payload.email });
    if (!employee) {
      employee = await Employee.create({
        employeeCode: generateEmployeeCode(index + 1),
        ...payload,
        status: 'Active',
      });
    }
    employees.push(employee);
  }

  const dateStrings = ['2026-03-22', '2026-03-23', '2026-03-24', '2026-03-25', '2026-03-26'];
  const statuses = ['Present', 'Present', 'Absent', 'Leave', 'Half Day'];

  for (const employee of employees) {
    for (let i = 0; i < dateStrings.length; i += 1) {
      const date = normalizeDate(dateStrings[i]);
      const status = employee.fullName === 'Rakesh Kumar' ? 'Present' : statuses[(i + employees.indexOf(employee)) % statuses.length];

      await Attendance.findOneAndUpdate(
        { employee: employee._id, date },
        {
          $set: {
            employee: employee._id,
            date,
            status,
            totalHours: status === 'Present' ? 8 : status === 'Half Day' ? 4 : 0,
            source: 'Manual',
            recordedBy: admin._id,
          },
        },
        { upsert: true, new: true }
      );
    }
  }

  await Checkin.deleteMany({ status: 'Active' });

  console.log('✅ Demo data seeded');
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
