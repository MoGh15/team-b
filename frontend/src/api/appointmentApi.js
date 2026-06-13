import api from './userApi';

export const appointmentApi = {
  getAvailability: (date) => api.get('/appointments/availability', { params: { date } }),
  create: (appointmentData) => api.post('/appointments', appointmentData),
  getAll: () => api.get('/appointments'),
  getById: (id) => api.get(`/appointments/${id}`),
  cancel: (id) => api.patch(`/appointments/${id}/cancel`),
};

export default appointmentApi;
