import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import appointmentApi from '../api/appointmentApi';
import './Appointments.css';

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await appointmentApi.getAll();
      setAppointments(response.data?.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load appointments.');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleCancel = async (id) => {
    try {
      setActionLoading(id);
      await appointmentApi.cancel(id);
      setAppointments((current) =>
        current.map((appointment) =>
          appointment._id === id ? { ...appointment, status: 'CANCELLED' } : appointment
        )
      );
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to cancel appointment.');
    } finally {
      setActionLoading('');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="appointments-page">
      <div className="appointments-header">
        <div>
          <h1>Appointments</h1>
          <p>Review booked appointments and cancel any scheduled visit.</p>
        </div>
        <Link className="appointments-link" to="/appointments/new">
          New Appointment
        </Link>
      </div>

      {loading ? (
        <p className="appointments-empty">Loading appointments…</p>
      ) : error ? (
        <p className="appointments-error">{error}</p>
      ) : appointments.length === 0 ? (
        <div className="appointments-empty">
          <p>No appointments found.</p>
          <Link className="appointments-action-link" to="/appointments/new">
            Book your first appointment
          </Link>
        </div>
      ) : (
        <div className="appointments-table-wrapper">
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Notes</th>
                <th>Patient</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment._id}>
                  <td>{formatDate(appointment.appointmentDate)}</td>
                  <td>{appointment.appointmentTime}</td>
                  <td>{appointment.status}</td>
                  <td>{appointment.notes || '-'}</td>
                  <td>{appointment.patientFormId?.patient?.firstName ? `${appointment.patientFormId.patient.firstName} ${appointment.patientFormId.patient.lastName}` : '-'}</td>
                  <td>
                    {appointment.status === 'SCHEDULED' ? (
                      <button
                        className="appointments-cancel"
                        type="button"
                        disabled={actionLoading === appointment._id}
                        onClick={() => handleCancel(appointment._id)}
                      >
                        {actionLoading === appointment._id ? 'Cancelling…' : 'Cancel Appointment'}
                      </button>
                    ) : (
                      <span className="appointments-status-text">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Appointments;
