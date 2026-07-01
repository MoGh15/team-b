import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import appointmentApi from '../api/appointmentApi';
import './Appointments.css';

function Appointments() {
  const { t, i18n } = useTranslation();
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
      setError(requestError.response?.data?.message || t('appointments.loadError'));
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
      setError(requestError.response?.data?.message || t('appointments.cancelError'));
    } finally {
      setActionLoading('');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(i18n.resolvedLanguage || i18n.language).format(date);
  };

  const getStatusLabel = (status) => {
    const normalizedStatus = String(status || '').toLowerCase();
    return t(`appointments.status.${normalizedStatus}`, { defaultValue: status || '-' });
  };

  return (
    <div className="appointments-page">
      <div className="appointments-header">
        <div>
          <h1>{t('appointments.title')}</h1>
          <p>{t('appointments.subtitle')}</p>
        </div>
        <Link className="appointments-link" to="/appointments/new">
          {t('appointments.newAppointment')}
        </Link>
      </div>

      {loading ? (
        <p className="appointments-empty">{t('appointments.loading')}</p>
      ) : error ? (
        <p className="appointments-error">{error}</p>
      ) : appointments.length === 0 ? (
        <div className="appointments-empty">
          <p>{t('appointments.empty')}</p>
          <Link className="appointments-action-link" to="/appointments/new">
            {t('appointments.bookFirst')}
          </Link>
        </div>
      ) : (
        <div className="appointments-table-wrapper">
          <table className="appointments-table">
            <thead>
              <tr>
                <th>{t('appointments.date')}</th>
                <th>{t('appointments.time')}</th>
                <th>{t('appointments.statusLabel')}</th>
                <th>{t('appointments.notes')}</th>
                <th>{t('appointments.patient')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment._id}>
                  <td>{formatDate(appointment.appointmentDate)}</td>
                  <td>{appointment.appointmentTime}</td>
                  <td>{getStatusLabel(appointment.status)}</td>
                  <td>{appointment.notes || '-'}</td>
                  <td>
                    {appointment.patientFormId?.patient?.firstName
                      ? `${appointment.patientFormId.patient.firstName} ${appointment.patientFormId.patient.lastName}`
                      : '-'}
                  </td>
                  <td>
                    {appointment.status === 'SCHEDULED' ? (
                      <button
                        className="appointments-cancel"
                        type="button"
                        disabled={actionLoading === appointment._id}
                        onClick={() => handleCancel(appointment._id)}
                      >
                        {actionLoading === appointment._id
                          ? t('appointments.cancelling')
                          : t('appointments.cancelAppointment')}
                      </button>
                    ) : (
                      <span className="appointments-status-text">-</span>
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
