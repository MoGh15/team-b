const express = require('express');
const {
  createPatientForm,
  getPatientForm,
  getPatientForms,
  updatePatientForm,
  updatePatientFormStatus
} = require('../controllers/patientFormController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', createPatientForm);
router.use(protect);
router.use(authorize('admin'));
router.get('/', getPatientForms);
router.get('/:id', getPatientForm);
router.put('/:id', updatePatientForm);
router.patch('/:id/status', updatePatientFormStatus);

module.exports = router;
