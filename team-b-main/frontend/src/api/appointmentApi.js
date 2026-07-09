import api from './userApi';

const LOCAL_APPOINTMENTS_KEY = 'clinicHealthForm.localAppointments';
const REQUEST_TIMEOUT = 3000;

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
  '13:00',
];

const isNetworkFailure = (error) => {
  return !error.response || error.code === 'ERR_NETWORK' || error.message === 'Network Error';
};

const isRecoverableApiFailure = (error) => {
  return isNetworkFailure(error) || error.response?.status >= 500 || typeof error.response?.data === 'string';
};

const normalizeDateKey = (dateValue) => {
  if (!dateValue) return '';

  if (typeof dateValue === 'string') {
    const match = dateValue.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const readLocalAppointments = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_APPOINTMENTS_KEY) || '[]');
  } catch (error) {
    return [];
  }
};

const writeLocalAppointments = (appointments) => {
  localStorage.setItem(LOCAL_APPOINTMENTS_KEY, JSON.stringify(appointments));
};

const sortAppointments = (appointments) => {
  return [...appointments].sort((a, b) => {
    const dateCompare = normalizeDateKey(a.appointmentDate).localeCompare(normalizeDateKey(b.appointmentDate));
    if (dateCompare !== 0) return dateCompare;
    return String(a.appointmentTime || '').localeCompare(String(b.appointmentTime || ''));
  });
};

const findLocalAppointment = (id) => {
  return readLocalAppointments().find((appointment) => appointment._id === id);
};

const getScheduledLocalAppointmentsByDate = (date) => {
  const dateKey = normalizeDateKey(date);
  return readLocalAppointments().filter((appointment) => {
    return normalizeDateKey(appointment.appointmentDate) === dateKey && appointment.status === 'SCHEDULED';
  });
};

const buildAvailabilitySlots = (date, remoteSlots = []) => {
  const remoteByTime = new Map(
    remoteSlots
      .filter((slot) => slot?.time)
      .map((slot) => [slot.time, slot])
  );
  const localBookedByTime = getScheduledLocalAppointmentsByDate(date).reduce((acc, appointment) => {
    acc[appointment.appointmentTime] = appointment.patientName || null;
    return acc;
  }, {});

  return workingHours.map((time) => {
    const remoteSlot = remoteByTime.get(time) || { time, booked: false, patientName: null };
    const localPatientName = localBookedByTime[time];

    return {
      ...remoteSlot,
      time,
      booked: Boolean(remoteSlot.booked || localPatientName),
      patientName: localPatientName || remoteSlot.patientName || null,
    };
  });
};

const createLocalAppointment = (appointmentData) => {
  const dateKey = normalizeDateKey(appointmentData.appointmentDate);
  const existingAppointment = getScheduledLocalAppointmentsByDate(dateKey).find(
    (appointment) => appointment.appointmentTime === appointmentData.appointmentTime
  );

  if (existingAppointment) {
    const error = new Error('Time slot already booked');
    error.response = { status: 400, data: { message: error.message } };
    throw error;
  }

  const now = new Date().toISOString();
  const appointment = {
    ...appointmentData,
    _id: `local-appointment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    appointmentDate: `${dateKey}T00:00:00.000Z`,
    patientName: appointmentData.patientName || '',
    notes: appointmentData.notes || '',
    status: 'SCHEDULED',
    savedLocally: true,
    createdAt: now,
    updatedAt: now,
  };

  writeLocalAppointments(sortAppointments([appointment, ...readLocalAppointments()]));
  return appointment;
};

const cancelLocalAppointment = (id) => {
  const now = new Date().toISOString();
  let updatedAppointment = null;
  const appointments = readLocalAppointments().map((appointment) => {
    if (appointment._id !== id) return appointment;

    updatedAppointment = {
      ...appointment,
      status: 'CANCELLED',
      updatedAt: now,
    };
    return updatedAppointment;
  });

  writeLocalAppointments(appointments);
  return updatedAppointment;
};

const buildResponse = (data, extra = {}) => ({
  data: {
    status: 'success',
    data,
    ...extra,
  },
});

export const appointmentApi = {
  getAvailability: async (date) => {
    try {
      const response = await api.get('/appointments/availability', {
        params: { date },
        timeout: REQUEST_TIMEOUT,
      });
      const remoteSlots = Array.isArray(response.data?.data) ? response.data.data : [];

      return {
        ...response,
        data: {
          ...response.data,
          data: buildAvailabilitySlots(date, remoteSlots),
        },
      };
    } catch (error) {
      if (!isRecoverableApiFailure(error)) {
        throw error;
      }

      return buildResponse(buildAvailabilitySlots(date), { savedLocally: true });
    }
  },
  create: async (appointmentData) => {
    try {
      return await api.post('/appointments', appointmentData, { timeout: REQUEST_TIMEOUT });
    } catch (error) {
      if (!isRecoverableApiFailure(error)) {
        throw error;
      }

      return buildResponse(createLocalAppointment(appointmentData), { savedLocally: true });
    }
  },
  getAll: async () => {
    const localAppointments = readLocalAppointments();

    try {
      const response = await api.get('/appointments', { timeout: REQUEST_TIMEOUT });
      const remoteAppointments = response.data?.data || [];

      return {
        ...response,
        data: {
          ...response.data,
          data: sortAppointments([...localAppointments, ...remoteAppointments]),
          count: localAppointments.length + remoteAppointments.length,
        },
      };
    } catch (error) {
      if (!isRecoverableApiFailure(error)) {
        throw error;
      }

      return buildResponse(sortAppointments(localAppointments), {
        count: localAppointments.length,
        savedLocally: true,
      });
    }
  },
  getById: async (id) => {
    const localAppointment = findLocalAppointment(id);

    if (localAppointment) {
      return buildResponse(localAppointment, { savedLocally: true });
    }

    return api.get(`/appointments/${id}`, { timeout: REQUEST_TIMEOUT });
  },
  cancel: async (id) => {
    const localAppointment = findLocalAppointment(id);

    if (localAppointment) {
      return buildResponse(cancelLocalAppointment(id), { savedLocally: true });
    }

    return api.patch(`/appointments/${id}/cancel`, undefined, { timeout: REQUEST_TIMEOUT });
  },
};

export default appointmentApi;
