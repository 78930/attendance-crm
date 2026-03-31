const express = require('express');
const auth = require('../middleware/auth');
const {
  getAttendance,
  getTodayAttendance,
  markAttendance,
  bulkAttendance,
} = require('../controllers/attendanceController');

const router = express.Router();

router.use(auth);
router.get('/', getAttendance);
router.get('/today', getTodayAttendance);
router.post('/mark', markAttendance);
router.post('/bulk', bulkAttendance);

module.exports = router;
