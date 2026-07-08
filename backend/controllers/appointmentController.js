const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const PatientForm = require('../models/PatientForm');

const workingHours = [
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00'
];

const allowedLanguages = ['de', 'en', 'ar'];

const normalizeLanguage = (language) => (allowedLanguages.includes(language) ? language : 'de');

const normalizeDate = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setHours(0, 0, 0, 0);
  return date;
};

const isValidTime = (time) => workingHours.includes(time);

exports.createAppointment = async (req, res) => {
  try {
    const { patientFormId, patientName, appointmentDate, appointmentTime, notes, language } = req.body;

    // Accept either a valid patientFormId OR a patientName
    let linkedPatientForm = null;
    if (patientFormId) {
      if (!mongoose.Types.ObjectId.isValid(patientFormId)) {
        return res.status(400).json({ status: 'error', message: 'Invalid patientFormId' });
      }

      linkedPatientForm = await PatientForm.findById(patientFormId);
      if (!linkedPatientForm) {
        return res.status(404).json({ status: 'error', message: 'Patient form not found' });
      }
    }

    if (!linkedPatientForm && (!patientName || !String(patientName).trim())) {
      return res.status(400).json({ status: 'error', message: 'Please provide patientFormId or patientName' });
    }

    const date = normalizeDate(appointmentDate);
    if (!date) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid appointment date'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot book an appointment in the past'
      });
    }

    if (!appointmentTime || !isValidTime(appointmentTime)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid appointment time'
      });
    }

    const existingAppointment = await Appointment.findOne({ appointmentDate: date, appointmentTime, status: 'SCHEDULED' });

    if (existingAppointment) {
      return res.status(400).json({ status: 'error', message: 'Time slot already booked' });
    }

    const appointment = await Appointment.create({
      language: linkedPatientForm ? normalizeLanguage(linkedPatientForm.language) : normalizeLanguage(language),
      patientFormId: linkedPatientForm ? linkedPatientForm._id : undefined,
      patientName: linkedPatientForm ? `${linkedPatientForm.patient?.firstName || ''} ${linkedPatientForm.patient?.lastName || ''}`.trim() : patientName,
      appointmentDate: date,
      appointmentTime,
      notes,
    });

    res.status(201).json({
      status: 'success',
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create appointment'
    });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate({
        path: 'patientFormId',
        select: 'patient doctorName language submittedAt'
      })
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    res.status(200).json({
      status: 'success',
      data: appointments,
      count: appointments.length
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch appointments'
    });
  }
};

exports.getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate({
      path: 'patientFormId',
      select: 'patient doctorName language submittedAt'
    });

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch appointment'
    });
  }
};

exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'CANCELLED' },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to cancel appointment'
    });
  }
};

exports.getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;
    const appointmentDate = normalizeDate(date);

    if (!appointmentDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid date in YYYY-MM-DD format'
      });
    }

    const scheduledAppointments = await Appointment.find({ appointmentDate, status: 'SCHEDULED' }).select('appointmentTime patientName');

    const bookedByTime = scheduledAppointments.reduce((acc, item) => {
      acc[item.appointmentTime] = item.patientName || null;
      return acc;
    }, {});

    const slots = workingHours.map((slot) => ({
      time: slot,
      booked: Boolean(bookedByTime[slot]),
      patientName: bookedByTime[slot] || null
    }));

    res.status(200).json({ status: 'success', data: slots });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch available slots'
    });
  }
};
