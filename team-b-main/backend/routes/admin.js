const express = require('express');
const {
  createDoctor,
  getDoctors,
  updateDoctor,
  updateDoctorStatus
} = require('../controllers/doctorController');
const { getPatientForms, getPatientForm } = require('../controllers/patientFormController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.post('/doctors', createDoctor);
router.get('/doctors', getDoctors);
router.patch('/doctors/:id', updateDoctor);
router.patch('/doctors/:id/status', updateDoctorStatus);

router.get('/patient-forms', getPatientForms);
router.get('/patient-forms/:id', getPatientForm);

module.exports = router;
