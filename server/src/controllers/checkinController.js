const Attendance = require('../models/Attendance');
const Checkin = require('../models/Checkin');
const Employee = require('../models/Employee');
const { normalizeDate, hoursBetween } = require('../utils/dateUtils');

async function activeCheckins(req, res) {
  const records = await Checkin.find({ status: 'Active' })
    .populate('employee')
    .sort({ checkInAt: -1 });

  return res.json(records);
}

async function checkIn(req, res) {
  const { employeeId, device = 'Web', locationText = '', notes = '' } = req.body;

  const employee = await Employee.findById(employeeId);
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  const existing = await Checkin.findOne({ employee: employeeId, status: 'Active' });
  if (existing) {
    return res.status(400).json({ message: 'Employee is already checked in' });
  }

  const today = normalizeDate(new Date());
  const now = new Date();

  const attendance = await Attendance.findOneAndUpdate(
    { employee: employeeId, date: today },
    {
      $set: {
        employee: employeeId,
        date: today,
        status: 'Present',
        checkInTime: now,
        source: 'Checkin',
        recordedBy: req.user?._id || null,
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  const record = await Checkin.create({
    employee: employeeId,
    attendance: attendance._id,
    checkInAt: now,
    status: 'Active',
    device,
    locationText,
    notes,
  });

  return res.status(201).json(await record.populate('employee'));
}

async function checkOut(req, res) {
  const { employeeId, notes = '' } = req.body;

  const active = await Checkin.findOne({ employee: employeeId, status: 'Active' }).populate('employee');
  if (!active) {
    return res.status(400).json({ message: 'No active check-in found' });
  }

  const checkoutTime = new Date();
  active.checkOutAt = checkoutTime;
  active.status = 'Closed';
  if (notes) active.notes = [active.notes, notes].filter(Boolean).join(' | ');
  await active.save();

  const today = normalizeDate(active.checkInAt);
  const totalHours = hoursBetween(active.checkInAt, checkoutTime);

  const attendance = await Attendance.findOneAndUpdate(
    { employee: employeeId, date: today },
    {
      $set: {
        status: 'Present',
        checkInTime: active.checkInAt,
        checkOutTime: checkoutTime,
        totalHours,
        source: 'Checkin',
        recordedBy: req.user?._id || null,
      },
    },
    { new: true }
  ).populate('employee');

  return res.json({
    checkin: active,
    attendance,
  });
}

module.exports = {
  activeCheckins,
  checkIn,
  checkOut,
};
