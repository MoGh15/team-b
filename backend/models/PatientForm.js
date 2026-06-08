const mongoose = require('mongoose');

const patientFormSchema = new mongoose.Schema(
  {
    patient: {
      firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
      },
      lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
      },
      birthDate: {
        type: Date,
        required: [true, 'Birth date is required']
      },
      phone: {
        type: String,
        trim: true
      },
      email: {
        type: String,
        trim: true,
        lowercase: true
      },
      street: {
        type: String,
        trim: true
      },
      houseNumber: {
        type: String,
        trim: true
      },
      postalCode: {
        type: String,
        trim: true
      },
      city: {
        type: String,
        trim: true
      }
    },
    symptoms: [
      {
        name: {
          type: String,
          required: true,
          trim: true
        },
        severity: {
          type: Number,
          min: 0,
          max: 10,
          default: 5
        },
        since: {
          type: String,
          trim: true
        },
        selection: {
          type: String,
          trim: true
        },
        notes: {
          type: String,
          trim: true
        }
      }
    ],
    allergies: [
      {
        type: String,
        trim: true
      }
    ],
    medications: [
      {
        type: String,
        trim: true
      }
    ],
    documents: [
      {
        name: String,
        type: String,
        size: Number
      }
    ],
    status: {
      type: String,
      enum: ['NEW', 'VIEWED', 'DONE'],
      default: 'NEW',
      index: true
    },
    statusUpdatedAt: {
      type: Date,
      default: Date.now
    },
    signatureCaptured: {
      type: Boolean,
      required: true,
      default: false
    },
    signatureDataUrl: {
      type: String,
      trim: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('PatientForm', patientFormSchema);
