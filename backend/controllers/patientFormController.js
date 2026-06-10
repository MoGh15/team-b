const mongoose = require('mongoose');
const PatientForm = require('../models/PatientForm');
const User = require('../models/User');

const allowedStatuses = ['NEW', 'VIEWED', 'DONE'];
const doctorPopulate = {
  path: 'doctorId',
  select: 'fullName name email specialization isActive status role'
};

const normalizeList = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter(Boolean);
};

const isActiveDoctor = (doctor) => {
  return doctor?.role === 'doctor' && doctor.isActive !== false && doctor.status === 'active';
};

const getDoctorDisplayName = (doctor) => {
  return doctor?.fullName || doctor?.name || '';
};

const isAssignedToDoctor = (form, doctorId) => {
  const assignedDoctorId = form?.doctorId?._id || form?.doctorId;
  return assignedDoctorId?.toString() === doctorId.toString();
};

const buildPatientFormQuery = (queryParams = {}) => {
  const { status, doctorId } = queryParams;
  const query = allowedStatuses.includes(status) ? { status } : {};

  if (doctorId) {
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      const error = new Error('Invalid doctorId');
      error.statusCode = 400;
      throw error;
    }

    query.doctorId = doctorId;
  }

  return query;
};

exports.createPatientForm = async (req, res) => {
  try {
    const {
      patient,
      symptoms,
      allergies,
      medications,
      documents,
      doctorId,
      signatureCaptured,
      signatureDataUrl
    } = req.body;

    if (!patient?.firstName || !patient?.lastName || !patient?.birthDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide first name, last name, and birth date'
      });
    }

    if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please select a valid doctor'
      });
    }

    const doctor = await User.findById(doctorId);

    if (!isActiveDoctor(doctor)) {
      return res.status(400).json({
        status: 'error',
        message: 'Selected doctor is not available'
      });
    }

    const birthDate = new Date(patient.birthDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (Number.isNaN(birthDate.getTime()) || birthDate > today) {
      return res.status(400).json({
        status: 'error',
        message: 'Geburtsdatum darf nicht in der Zukunft liegen.'
      });
    }

    if (!signatureCaptured) {
      return res.status(400).json({
        status: 'error',
        message: 'Signature is required before submitting the form'
      });
    }

    const form = await PatientForm.create({
      patient,
      symptoms: normalizeList(symptoms),
      allergies: normalizeList(allergies),
      medications: normalizeList(medications),
      documents: normalizeList(documents),
      doctorId: doctor._id,
      doctorName: getDoctorDisplayName(doctor),
      signatureCaptured: Boolean(signatureCaptured),
      signatureDataUrl
    });

    res.status(201).json({
      status: 'success',
      message: 'Patient form submitted successfully',
      data: {
        id: form._id,
        submittedAt: form.submittedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to submit patient form'
    });
  }
};

exports.getPatientForms = async (req, res) => {
  try {
    const query = buildPatientFormQuery(req.query);
    const forms = await PatientForm.find(query).populate(doctorPopulate).sort({ submittedAt: -1 });

    res.status(200).json({
      status: 'success',
      data: forms,
      count: forms.length
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: 'error',
      message: error.message || 'Failed to fetch patient forms'
    });
  }
};

exports.getPatientForm = async (req, res) => {
  try {
    const form = await PatientForm.findById(req.params.id).populate(doctorPopulate);

    if (!form) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient form not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: form
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch patient form'
    });
  }
};

exports.getDoctorPatientForms = async (req, res) => {
  try {
    if (req.query.doctorId && req.query.doctorId !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Doctors can only access patient forms assigned to them'
      });
    }

    const query = buildPatientFormQuery({
      ...req.query,
      doctorId: req.user._id.toString()
    });
    const forms = await PatientForm.find(query).populate(doctorPopulate).sort({ submittedAt: -1 });

    res.status(200).json({
      status: 'success',
      data: forms,
      count: forms.length
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: 'error',
      message: error.message || 'Failed to fetch assigned patient forms'
    });
  }
};

exports.getDoctorPatientForm = async (req, res) => {
  try {
    const form = await PatientForm.findById(req.params.id).populate(doctorPopulate);

    if (!form) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient form not found'
      });
    }

    if (!isAssignedToDoctor(form, req.user._id)) {
      return res.status(403).json({
        status: 'error',
        message: 'Doctors can only access patient forms assigned to them'
      });
    }

    res.status(200).json({
      status: 'success',
      data: form
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch assigned patient form'
    });
  }
};

exports.updateDoctorConsultation = async (req, res) => {
  try {
    const { diagnosis, notes, prescription, status } = req.body;

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Status must be NEW, VIEWED, or DONE'
      });
    }

    const form = await PatientForm.findById(req.params.id);

    if (!form) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient form not found'
      });
    }

    if (!isAssignedToDoctor(form, req.user._id)) {
      return res.status(403).json({
        status: 'error',
        message: 'Doctors can only update patient forms assigned to them'
      });
    }

    form.consultation = {
      diagnosis: diagnosis || '',
      notes: notes || '',
      prescription: prescription || '',
      updatedAt: new Date(),
      updatedBy: req.user._id
    };

    if (status) {
      form.status = status;
      form.statusUpdatedAt = new Date();
    }

    await form.save();
    await form.populate(doctorPopulate);

    res.status(200).json({
      status: 'success',
      data: form
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update doctor consultation'
    });
  }
};

exports.updatePatientForm = async (req, res) => {
  try {
    const allowedUpdates = [
      'patient',
      'symptoms',
      'allergies',
      'medications',
      'documents',
      'signatureCaptured',
      'signatureDataUrl'
    ];
    const updates = {};

    allowedUpdates.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    });

    const form = await PatientForm.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    if (!form) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient form not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: form
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update patient form'
    });
  }
};

exports.updatePatientFormStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Status must be NEW, VIEWED, or DONE'
      });
    }

    const form = await PatientForm.findByIdAndUpdate(
      req.params.id,
      {
        status,
        statusUpdatedAt: new Date()
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!form) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient form not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: form
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update patient form status'
    });
  }
};
