const express = require('express');
const router = express.Router();
const { createBooking, getRecentBookings } = require('../controllers/bookingController');
const { authenticate, attachDB } = require('../middleware/auth');

router.post('/', authenticate, attachDB, createBooking);
router.get('/:agencyId', authenticate, attachDB, getRecentBookings);

module.exports = router;
