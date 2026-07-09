import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import appointmentApi from '../api/appointmentApi';
import { normalizeLanguage } from '../i18n';
import './AppointmentBooking.css';

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const readPendingAppointmentContext = () => {
  try {
    return JSON.parse(sessionStorage.getItem('pendingAppointmentContext') || 'null') || {};
  } catch (error) {
    return {};
  }
};

const isMongoObjectId = (value) => /^[a-f\d]{24}$/i.test(value || '');

function AppointmentBooking() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const pendingContext = readPendingAppointmentContext();
  const initialPatientFormId =
    location.state?.patientFormId ||
    searchParams.get('patientFormId') ||
    pendingContext.patientFormId ||
    localStorage.getItem('patientFormId') ||
    '';
  const initialLanguage = location.state?.language || searchParams.get('lng') || pendingContext.language || '';
  const initialPatientName = location.state?.patientName || searchParams.get('patientName') || pendingContext.patientName || '';
  const [patientFormId] = useState(initialPatientFormId);
  const [patientName, setPatientName] = useState(initialPatientName);
  const [appointmentDate, setAppointmentDate] = useState(getTodayDateString());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [days, setDays] = useState([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [weekAvailability, setWeekAvailability] = useState({});

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

  useEffect(() => {
    if (!initialLanguage) return;

    const nextLanguage = normalizeLanguage(initialLanguage);
    if (nextLanguage !== i18n.resolvedLanguage) {
      i18n.changeLanguage(nextLanguage);
    }
  }, [initialLanguage, i18n]);

  const fetchAvailableSlots = async (date) => {
    if (!date) {
      setAvailableSlots([]);
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      const response = await appointmentApi.getAvailability(date);
      console.debug('availability response', response?.data);
      let data = response.data?.data || [];

      if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
        data = data.map((time) => ({ time, booked: false, patientName: null }));
      }

      if (!Array.isArray(data) || data.length === 0) {
        data = workingHours.map((time) => ({ time, booked: false, patientName: null }));
      }

      setAvailableSlots(data);
      setSelectedTime('');
    } catch (error) {
      console.error('availability error', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('appointmentBooking.loadSlotsError')
      });
      setAvailableSlots(workingHours.map((time) => ({ time, booked: false, patientName: null })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableSlots(appointmentDate);
    const fromState = location.state?.patientName;
    const fromQuery = new URLSearchParams(location.search).get('patientName');
    if (fromState && fromState !== patientName) setPatientName(fromState);
    else if (fromQuery && fromQuery !== patientName) setPatientName(fromQuery);
  }, [appointmentDate]);

  useEffect(() => {
    const locale = i18n.resolvedLanguage || i18n.language;
    const nextDays = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index);
      const iso = date.toISOString().slice(0, 10);
      const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date);
      return { iso, display: `${weekday} ${iso}` };
    });
    const filtered = nextDays.filter((day) => new Date(day.iso).getDay() !== 5);
    setDays(filtered);
    const selectedIndex = filtered.findIndex((day) => day.iso === appointmentDate);
    setSelectedDayIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [i18n.resolvedLanguage, i18n.language]);

  const fetchSlots = async (date) => {
    try {
      const response = await appointmentApi.getAvailability(date);
      let data = response.data?.data || [];

      if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
        data = data.map((time) => ({ time, booked: false, patientName: null }));
      }

      if (!Array.isArray(data) || data.length === 0) {
        data = workingHours.map((time) => ({ time, booked: false, patientName: null }));
      }

      return data;
    } catch (error) {
      return workingHours.map((time) => ({ time, booked: false, patientName: null }));
    }
  };

  useEffect(() => {
    if (!days || days.length === 0) return;
    let mounted = true;
    const loadWeek = async () => {
      const promises = days.map((day) => fetchSlots(day.iso));
      const results = await Promise.all(promises);
      if (!mounted) return;
      const map = {};
      days.forEach((day, index) => {
        map[day.iso] = results[index];
      });
      setWeekAvailability(map);
    };
    loadWeek();
    return () => {
      mounted = false;
    };
  }, [days]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: '', text: '' });

    const canLinkRemoteForm = isMongoObjectId(patientFormId);
    if (!canLinkRemoteForm && !patientName.trim()) {
      setMessage({ type: 'error', text: t('appointmentBooking.patientNameRequired') });
      return;
    }

    if (!selectedTime) {
      setMessage({ type: 'error', text: t('appointmentBooking.timeRequired') });
      return;
    }

    try {
      setSubmitLoading(true);
      const appointmentPayload = {
        appointmentDate,
        appointmentTime: selectedTime,
        notes: notes.trim(),
        language: normalizeLanguage(i18n.resolvedLanguage || i18n.language),
      };

      if (canLinkRemoteForm) {
        appointmentPayload.patientFormId = patientFormId;
      } else {
        appointmentPayload.patientName = patientName.trim();
      }

      await appointmentApi.create(appointmentPayload);

      setMessage({ type: 'success', text: t('appointmentBooking.success') });
      setSelectedTime('');
      setNotes('');
      sessionStorage.removeItem('pendingAppointmentContext');
      fetchAvailableSlots(appointmentDate);
      navigate('/appointments');
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('appointmentBooking.bookError')
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="appointment-page">
      <div className="appointment-header">
        <div />
        <Link className="appointment-link" to="/appointments">
          {t('appointmentBooking.viewAppointments')}
        </Link>
      </div>

      <form className="appointment-form" onSubmit={handleSubmit}>
        <label>
          {t('appointmentBooking.patientName')}
          <input
            type="text"
            value={patientName}
            onChange={(event) => setPatientName(event.target.value)}
            placeholder={t('appointmentBooking.patientNamePlaceholder')}
          />
        </label>

        <label>
          {t('appointmentBooking.date')}
          <input
            type="date"
            value={appointmentDate}
            min={getTodayDateString()}
            onChange={(event) => {
              setAppointmentDate(event.target.value);
              fetchAvailableSlots(event.target.value);
            }}
          />
        </label>

        <div className="appointment-slots">
          <div className="appointment-slots-header">
            <h2>{t('appointmentBooking.availableSlots')}</h2>
            {loading && <span className="slot-loading">{t('appointmentBooking.loadingSlots')}</span>}
          </div>

          {availableSlots.length > 0 ? (
            <div className="slot-grid">
              {availableSlots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  className={`slot-button ${selectedTime === slot.time ? 'selected' : ''} ${slot.booked ? 'booked' : ''}`}
                  onClick={() => !slot.booked && setSelectedTime(slot.time)}
                  disabled={slot.booked}
                >
                  <div>{slot.time}</div>
                  <div className="slot-state">
                    {slot.booked
                      ? slot.patientName
                        ? t('appointmentBooking.bookedWithPatient', { patient: slot.patientName })
                        : t('appointmentBooking.booked')
                      : t('appointmentBooking.available')}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="no-slots-text">
              {t('appointmentBooking.noSlots')}
              <div className="no-slots-detail">
                {loading ? t('appointmentBooking.loading') : JSON.stringify(availableSlots, null, 2)}
              </div>
            </div>
          )}
        </div>

        <label>
          {t('appointmentBooking.notes')}
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t('appointmentBooking.notesPlaceholder')}
          />
        </label>

        {message.text && (
          <div className={`appointment-message ${message.type}`}>{message.text}</div>
        )}

        <button className="appointment-submit" type="submit" disabled={submitLoading}>
          {submitLoading ? t('appointmentBooking.submitting') : t('appointmentBooking.submit')}
        </button>
      </form>
    </div>
  );
}

export default AppointmentBooking;
