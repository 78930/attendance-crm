const Attendance = require('../models/Attendance');
const Checkin = require('../models/Checkin');
const Employee = require('../models/Employee');
const { startOfDay, endOfDay, formatDateKey } = require('../utils/dateUtils');
const { toCsv } = require('../utils/csv');

function buildDateFilter(from, to) {
  const dateQuery = {};
  if (from) dateQuery.$gte = startOfDay(from);
  if (to) dateQuery.$lte = endOfDay(to);

  if (!from && !to) {
    const today = new Date();
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    dateQuery.$gte = start;
    dateQuery.$lte = endOfDay(today);
  }

  return dateQuery;
}

async function dashboard(req, res) {
  const dateQuery = buildDateFilter(req.query.from, req.query.to);

  const [employeeCount, activeEmployees, activeCheckins, attendanceRecords, recentCheckins] = await Promise.all([
    Employee.countDocuments(),
    Employee.countDocuments({ status: 'Active' }),
    Checkin.countDocuments({ status: 'Active' }),
    Attendance.find({ date: dateQuery }).populate('employee').sort({ date: -1 }),
    Checkin.find().populate('employee').sort({ createdAt: -1 }).limit(6),
  ]);

  const todayKey = formatDateKey(new Date());
  const todayRecords = attendanceRecords.filter((record) => formatDateKey(record.date) === todayKey);
  const todayPresent = todayRecords.filter((record) => record.status === 'Present').length;
  const todayAbsent = todayRecords.filter((record) => record.status === 'Absent').length;
  const rate = activeEmployees
    ? Number(((todayPresent / activeEmployees) * 100).toFixed(1))
    : 0;

  return res.json({
    totals: {
      employeeCount,
      activeEmployees,
      activeCheckins,
      todayPresent,
      todayAbsent,
      attendanceRate: rate,
    },
    recentCheckins,
    latestAttendance: attendanceRecords.slice(0, 8),
  });
}

async function attendanceSummary(req, res) {
  const dateQuery = buildDateFilter(req.query.from, req.query.to);

  const [attendanceRecords, employees] = await Promise.all([
    Attendance.find({ date: dateQuery }).populate('employee').sort({ date: 1 }),
    Employee.find({ status: 'Active' }),
  ]);

  const statusMap = new Map();
  const dayMap = new Map();
  const departmentMap = new Map();
  const employeeHours = new Map();

  attendanceRecords.forEach((record) => {
    statusMap.set(record.status, (statusMap.get(record.status) || 0) + 1);

    const dayKey = formatDateKey(record.date);
    if (!dayMap.has(dayKey)) {
      dayMap.set(dayKey, {
        date: dayKey,
        Present: 0,
        Absent: 0,
        Leave: 0,
        'Half Day': 0,
        'Week Off': 0,
      });
    }
    dayMap.get(dayKey)[record.status] += 1;

    const department = record.employee?.department || 'General';
    if (!departmentMap.has(department)) {
      departmentMap.set(department, {
        department,
        Present: 0,
        Absent: 0,
        Leave: 0,
        'Half Day': 0,
        'Week Off': 0,
      });
    }
    departmentMap.get(department)[record.status] += 1;

    if (record.employee) {
      const employeeId = String(record.employee._id);
      const existing =
        employeeHours.get(employeeId) || {
          employeeId,
          fullName: record.employee.fullName,
          employeeCode: record.employee.employeeCode,
          department: record.employee.department,
          daysPresent: 0,
          totalHours: 0,
        };

      if (record.status === 'Present') {
        existing.daysPresent += 1;
      }
      existing.totalHours = Number((existing.totalHours + (record.totalHours || 0)).toFixed(2));
      employeeHours.set(employeeId, existing);
    }
  });

  const statusCounts = Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    count,
  }));

  const dailyTrend = Array.from(dayMap.values()).map((item) => ({
    date: item.date,
    present: item.Present,
    absent: item.Absent,
    leave: item.Leave,
    halfDay: item['Half Day'],
    weekOff: item['Week Off'],
  }));

  const departmentSummary = Array.from(departmentMap.values()).map((item) => ({
    department: item.department,
    present: item.Present,
    absent: item.Absent,
    leave: item.Leave,
    halfDay: item['Half Day'],
    weekOff: item['Week Off'],
  }));

  const employeeRanking = Array.from(employeeHours.values())
    .sort((a, b) => b.totalHours - a.totalHours)
    .slice(0, 10);

  const uniqueEmployeesWithRecords = new Set(
    attendanceRecords
      .filter((record) => record.employee?._id)
      .map((record) => String(record.employee._id))
  ).size;

  const coverage = employees.length
    ? Number(((uniqueEmployeesWithRecords / employees.length) * 100).toFixed(1))
    : 0;

  return res.json({
    statusCounts,
    dailyTrend,
    departmentSummary,
    employeeRanking,
    meta: {
      totalRecords: attendanceRecords.length,
      activeEmployees: employees.length,
      coverage,
    },
  });
}

async function exportAttendance(req, res) {
  const dateQuery = buildDateFilter(req.query.from, req.query.to);

  const attendanceRecords = await Attendance.find({ date: dateQuery })
    .populate('employee')
    .sort({ date: 1 });

  const rows = attendanceRecords.map((record) => ({
    Date: formatDateKey(record.date),
    EmployeeCode: record.employee?.employeeCode || '',
    EmployeeName: record.employee?.fullName || '',
    Department: record.employee?.department || '',
    Designation: record.employee?.designation || '',
    Status: record.status,
    CheckIn: record.checkInTime ? new Date(record.checkInTime).toISOString() : '',
    CheckOut: record.checkOutTime ? new Date(record.checkOutTime).toISOString() : '',
    TotalHours: record.totalHours || 0,
    Source: record.source,
    Notes: record.notes || '',
  }));

  const csv = toCsv(rows);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="attendance-report.csv"');
  return res.send(csv);
}

module.exports = {
  dashboard,
  attendanceSummary,
  exportAttendance,
};
