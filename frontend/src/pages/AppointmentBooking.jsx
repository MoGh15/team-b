import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import appointmentApi from '../api/appointmentApi';
import './AppointmentBooking.css';

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function AppointmentBooking() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialPatientName = location.state?.patientName || new URLSearchParams(location.search).get('patientName') || '';
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

      // If backend returns array of strings (previous implementation), convert to objects
      if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
        data = data.map((t) => ({ time: t, booked: false, patientName: null }));
      }

      // If backend returned empty array, generate default slots from workingHours
      if (!Array.isArray(data) || data.length === 0) {
        data = workingHours.map((t) => ({ time: t, booked: false, patientName: null }));
      }

      setAvailableSlots(data);
      setSelectedTime('');
    } catch (error) {
      console.error('availability error', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Unable to load available time slots.'
      });
      // fallback to default working hours on error
      setAvailableSlots(workingHours.map((t) => ({ time: t, booked: false, patientName: null })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableSlots(appointmentDate);
    // If navigated with state or query param, keep patientName in sync
    const fromState = location.state?.patientName;
    const fromQuery = new URLSearchParams(location.search).get('patientName');
    if (fromState && fromState !== patientName) setPatientName(fromState);
    else if (fromQuery && fromQuery !== patientName) setPatientName(fromQuery);
  }, [appointmentDate]);

  useEffect(() => {
    // prepare next 7 days
    const nextDays = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
      return { iso, display: `${weekday} ${iso}` };
    });
    // exclude Fridays
    const filtered = nextDays.filter((x) => new Date(x.iso).getDay() !== 5);
    setDays(filtered);
    // select first day by default
    setSelectedDayIndex(0);
    if (filtered[0]) setAppointmentDate(filtered[0].iso);
  }, []);

  // helper to fetch slots for a single date (shared by single-day and week fetches)
  const fetchSlots = async (date) => {
    try {
      const response = await appointmentApi.getAvailability(date);
      let data = response.data?.data || [];

      if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
        data = data.map((t) => ({ time: t, booked: false, patientName: null }));
      }

      if (!Array.isArray(data) || data.length === 0) {
        data = workingHours.map((t) => ({ time: t, booked: false, patientName: null }));
      }

      return data;
    } catch (error) {
      return workingHours.map((t) => ({ time: t, booked: false, patientName: null }));
    }
  };

  // fetch availability for the whole week (for the weekly boxes view)
  useEffect(() => {
    if (!days || days.length === 0) return;
    let mounted = true;
    const loadWeek = async () => {
      const promises = days.map((d) => fetchSlots(d.iso));
      const results = await Promise.all(promises);
      if (!mounted) return;
      const map = {};
      days.forEach((d, i) => {
        map[d.iso] = results[i];
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

    if (!patientName.trim()) {
      setMessage({ type: 'error', text: 'الاسم مطلوب لحجز الموعد.' });
      return;
    }

    if (!selectedTime) {
      setMessage({ type: 'error', text: 'Please select an available time slot.' });
      return;
    }

    try {
      setSubmitLoading(true);
      await appointmentApi.create({
        patientName: patientName.trim(),
        appointmentDate,
        appointmentTime: selectedTime,
        notes: notes.trim()
      });

      setMessage({ type: 'success', text: 'تم حجز الموعد بنجاح.' });
      setSelectedTime('');
      setNotes('');
      fetchAvailableSlots(appointmentDate);
      // انتقل لصفحة المواعيد بعد الحجز
      navigate('/appointments');
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to book appointment.'
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="appointment-page">
      {/* keep only the View Appointments link at the top */}
      <div className="appointment-header">
        <div />
        <Link className="appointment-link" to="/appointments">
          View Appointments
        </Link>
      </div>

      <form className="appointment-form" onSubmit={handleSubmit}>
        <label>
          اسم المريض
          <input
            type="text"
            value={patientName}
            onChange={(event) => setPatientName(event.target.value)}
            placeholder="أدخل اسم المريض للحجز"
          />
        </label>

        <label>
          Appointment Date
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
            <h2>Available Time Slots</h2>
            {loading && <span className="slot-loading">Loading slots…</span>}
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
                  <div style={{ fontSize: '0.85rem', marginTop: 6 }}>
                    {slot.booked ? `محجوز${slot.patientName ? ` - ${slot.patientName}` : ''}` : 'غير محجوز'}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="no-slots-text">
              لا توجد مواعيد متاحة لهذا التاريخ.
              <div style={{ marginTop: 8, fontSize: 12, color: '#7a7a7a' }}>
                {loading ? 'جارٍ التحميل...' : <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(availableSlots, null, 2)}</pre>}
              </div>
            </div>
          )}
        </div>

        <label>
          Notes
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Add any notes for the appointment"
          />
        </label>

        {message.text && (
          <div className={`appointment-message ${message.type}`}>{message.text}</div>
        )}

        <button className="appointment-submit" type="submit" disabled={submitLoading}>
          {submitLoading ? 'Booking…' : 'Book Appointment'}
        </button>
      </form>
    </div>
  );
}

export default AppointmentBooking;
