const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const { normalizeDate, startOfDay, endOfDay } = require('../utils/dateUtils');

async function getAttendance(req, res) {
  const { employeeId, status, from, to } = req.query;

  const query = {};
  if (employeeId) query.employee = employeeId;
  if (status) query.status = status;
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = startOfDay(from);
    if (to) query.date.$lte = endOfDay(to);
  }

  const records = await Attendance.find(query)
    .populate('employee')
    .sort({ date: -1, createdAt: -1 });

  return res.json(records);
}

async function getTodayAttendance(req, res) {
  const employees = await Employee.find({ status: 'Active' }).sort({ fullName: 1 });
  const selectedDate = normalizeDate(req.query.date || new Date());

  const attendance = await Attendance.find({ date: selectedDate });
  const map = new Map(attendance.map((record) => [String(record.employee), record]));

  return res.json(
    employees.map((employee) => ({
      employee,
      attendance: map.get(String(employee._id)) || null,
    }))
  );
}

async function markAttendance(req, res) {
  const { employeeId, date, status, notes = '', checkInTime = null, checkOutTime = null, source = 'Manual' } =
    req.body;

  const normalized = normalizeDate(date);

  const record = await Attendance.findOneAndUpdate(
    { employee: employeeId, date: normalized },
    {
      employee: employeeId,
      date: normalized,
      status,
      notes,
      checkInTime,
      checkOutTime,
      source,
      recordedBy: req.user?._id || null,
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  ).populate('employee');

  return res.json(record);
}

async function bulkAttendance(req, res) {
  const { date, records = [] } = req.body;
  const normalized = normalizeDate(date);

  const operations = records
    .filter((record) => record.employeeId && record.status)
    .map((record) => ({
      updateOne: {
        filter: { employee: record.employeeId, date: normalized },
        update: {
          $set: {
            employee: record.employeeId,
            date: normalized,
            status: record.status,
            notes: record.notes || '',
            source: 'Manual',
            recordedBy: req.user?._id || null,
          },
        },
        upsert: true,
      },
    }));

  if (operations.length) {
    await Attendance.bulkWrite(operations);
  }

  const saved = await Attendance.find({ date: normalized }).populate('employee').sort({ createdAt: -1 });

  return res.json(saved);
}

module.exports = {
  getAttendance,
  getTodayAttendance,
  markAttendance,
  bulkAttendance,
};
