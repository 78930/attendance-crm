const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Checkin = require('../models/Checkin');
const generateEmployeeCode = require('../utils/generateEmployeeCode');

async function listEmployees(req, res) {
  const { search = '', department = '', status = '' } = req.query;

  const query = {};
  if (department) query.department = department;
  if (status) query.status = status;
  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [
      { fullName: regex },
      { employeeCode: regex },
      { email: regex },
      { phone: regex },
      { designation: regex },
    ];
  }

  const employees = await Employee.find(query).sort({ createdAt: -1 });
  const activeCheckins = await Checkin.find({ status: 'Active' }).select('employee');
  const activeSet = new Set(activeCheckins.map((item) => String(item.employee)));

  return res.json(
    employees.map((employee) => ({
      ...employee.toObject(),
      isCheckedIn: activeSet.has(String(employee._id)),
    }))
  );
}

async function createEmployee(req, res) {
  const count = await Employee.countDocuments();
  const employee = await Employee.create({
    employeeCode: req.body.employeeCode || generateEmployeeCode(count + 1),
    fullName: req.body.fullName,
    email: req.body.email || '',
    phone: req.body.phone || '',
    department: req.body.department || 'General',
    designation: req.body.designation || 'Employee',
    joinDate: req.body.joinDate || new Date(),
    status: req.body.status || 'Active',
    notes: req.body.notes || '',
  });

  return res.status(201).json(employee);
}

async function updateEmployee(req, res) {
  const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  return res.json(employee);
}

async function deleteEmployee(req, res) {
  const employee = await Employee.findById(req.params.id);
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  await Attendance.deleteMany({ employee: employee._id });
  await Checkin.deleteMany({ employee: employee._id });
  await employee.deleteOne();

  return res.json({ message: 'Employee deleted' });
}

module.exports = {
  listEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
