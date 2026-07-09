const express = require('express');
const {
  createAppointment,
  getAppointments,
  getAppointment,
  cancelAppointment,
  getAvailableSlots
} = require('../controllers/appointmentController');

const router = express.Router();

router.post('/', createAppointment);
router.get('/availability', getAvailableSlots);
router.get('/', getAppointments);
router.get('/:id', getAppointment);
router.patch('/:id/cancel', cancelAppointment);

module.exports = router;
