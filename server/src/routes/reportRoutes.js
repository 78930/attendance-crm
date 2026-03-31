const express = require('express');
const auth = require('../middleware/auth');
const { dashboard, attendanceSummary, exportAttendance } = require('../controllers/reportController');

const router = express.Router();

router.use(auth);
router.get('/dashboard', dashboard);
router.get('/attendance-summary', attendanceSummary);
router.get('/export', exportAttendance);

module.exports = router;
