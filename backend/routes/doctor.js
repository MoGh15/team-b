const express = require('express');
const {
  getDoctorPatientForm,
  getDoctorPatientForms,
  updateDoctorConsultation
} = require('../controllers/patientFormController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('doctor'));

router.get('/patient-forms', getDoctorPatientForms);
router.get('/patient-forms/:id', getDoctorPatientForm);
router.patch('/patient-forms/:id/consultation', updateDoctorConsultation);

module.exports = router;
