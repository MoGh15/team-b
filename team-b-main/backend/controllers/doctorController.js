const User = require('../models/User');

const doctorSelect = '-password';

const getDoctorName = (doctor) => doctor.fullName || doctor.name;

const serializeDoctor = (doctor) => {
  const data = doctor.toObject ? doctor.toObject() : { ...doctor };
  delete data.password;

  return {
    ...data,
    fullName: data.fullName || data.name,
    isActive: data.isActive !== false && data.status === 'active'
  };
};

exports.getPublicDoctors = async (req, res) => {
  try {
    const doctors = await User.find({
      role: 'doctor',
      status: 'active',
      isActive: { $ne: false }
    })
      .select(doctorSelect)
      .sort({ fullName: 1, name: 1 });

    res.status(200).json({
      status: 'success',
      data: doctors.map(serializeDoctor),
      count: doctors.length
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch doctors'
    });
  }
};

exports.createDoctor = async (req, res) => {
  try {
    const { fullName, name, email, password, specialization, isActive = true } = req.body;
    const doctorName = (fullName || name || '').trim();
    const nextIsActive = typeof isActive === 'boolean' ? isActive : isActive !== 'false';

    if (!doctorName || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide fullName, email, and password'
      });
    }

    const existingDoctor = await User.findOne({ email: email.toLowerCase() });

    if (existingDoctor) {
      return res.status(409).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    const doctor = await User.create({
      name: doctorName,
      fullName: doctorName,
      email,
      password,
      role: 'doctor',
      specialization,
      isActive: nextIsActive,
      status: nextIsActive ? 'active' : 'inactive'
    });

    res.status(201).json({
      status: 'success',
      message: 'Doctor account created successfully',
      data: serializeDoctor(doctor)
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create doctor account'
    });
  }
};

exports.getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select(doctorSelect).sort({ fullName: 1, name: 1 });

    res.status(200).json({
      status: 'success',
      data: doctors.map(serializeDoctor),
      count: doctors.length
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch doctors'
    });
  }
};

exports.updateDoctor = async (req, res) => {
  try {
    const { fullName, name, email, password, specialization, isActive, status } = req.body;
    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' });

    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found'
      });
    }

    const nextName = (fullName || name || '').trim();

    if (nextName) {
      doctor.name = nextName;
      doctor.fullName = nextName;
    }

    if (email && email.toLowerCase() !== doctor.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase(), _id: { $ne: doctor._id } });

      if (existingUser) {
        return res.status(409).json({
          status: 'error',
          message: 'User with this email already exists'
        });
      }

      doctor.email = email;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'specialization')) {
      doctor.specialization = specialization || '';
    }

    if (password) {
      doctor.password = password;
    }

    if (typeof isActive === 'boolean' || ['active', 'inactive'].includes(status)) {
      const nextIsActive = typeof isActive === 'boolean' ? isActive : status === 'active';
      doctor.isActive = nextIsActive;
      doctor.status = nextIsActive ? 'active' : 'inactive';
    }

    doctor.role = 'doctor';
    await doctor.save();

    res.status(200).json({
      status: 'success',
      message: 'Doctor account updated successfully',
      data: serializeDoctor(doctor)
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update doctor account'
    });
  }
};

exports.updateDoctorStatus = async (req, res) => {
  try {
    const { isActive, status } = req.body;

    if (typeof isActive !== 'boolean' && !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide isActive boolean or status active/inactive'
      });
    }

    const nextIsActive = typeof isActive === 'boolean' ? isActive : status === 'active';
    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' });

    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found'
      });
    }

    doctor.isActive = nextIsActive;
    doctor.status = nextIsActive ? 'active' : 'inactive';
    await doctor.save();

    res.status(200).json({
      status: 'success',
      message: `${getDoctorName(doctor)} is now ${nextIsActive ? 'active' : 'inactive'}`,
      data: serializeDoctor(doctor)
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update doctor status'
    });
  }
};
