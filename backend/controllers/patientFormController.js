const PatientForm = require('../models/PatientForm');

const allowedStatuses = ['NEW', 'VIEWED', 'DONE'];

const normalizeList = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter(Boolean);
};

exports.createPatientForm = async (req, res) => {
  try {
    const {
      patient,
      symptoms,
      allergies,
      medications,
      documents,
      signatureCaptured,
      signatureDataUrl
    } = req.body;

    if (!patient?.firstName || !patient?.lastName || !patient?.birthDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide first name, last name, and birth date'
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
    const { status } = req.query;
    const query = allowedStatuses.includes(status) ? { status } : {};
    const forms = await PatientForm.find(query).sort({ submittedAt: -1 });

    res.status(200).json({
      status: 'success',
      data: forms,
      count: forms.length
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch patient forms'
    });
  }
};

exports.getPatientForm = async (req, res) => {
  try {
    const form = await PatientForm.findById(req.params.id);

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
