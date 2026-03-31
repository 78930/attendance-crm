const express = require('express');
const auth = require('../middleware/auth');
const { activeCheckins, checkIn, checkOut } = require('../controllers/checkinController');

const router = express.Router();

router.use(auth);
router.get('/active', activeCheckins);
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);

module.exports = router;
