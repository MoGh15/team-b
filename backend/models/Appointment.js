const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patientFormId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PatientForm'
    },
    patientName: {
      type: String,
      trim: true
    },
    appointmentDate: {
      type: Date,
      required: true
    },
    appointmentTime: {
      type: String,
      required: true
    },
    notes: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'],
      default: 'SCHEDULED'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
