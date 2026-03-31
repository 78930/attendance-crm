import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const statusOptions = ['Present', 'Absent', 'Half Day', 'Leave', 'Week Off'];

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendancePage() {
  const { token } = useAuth();
  const [date, setDate] = useState(getTodayString());
  const [todayRows, setTodayRows] = useState([]);
  const [activeCheckins, setActiveCheckins] = useState([]);
  const [draftStatuses, setDraftStatuses] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadAttendance() {
    try {
      const todayResponse = await api.get(`/attendance/today?date=${date}`, token);
      const checkinResponse = await api.get('/checkins/active', token);

      setTodayRows(todayResponse);
      setActiveCheckins(checkinResponse);
      const nextDrafts = {};
      todayResponse.forEach((item) => {
        nextDrafts[item.employee._id] = item.attendance?.status || 'Present';
      });
      setDraftStatuses(nextDrafts);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadAttendance();
  }, [token, date]);

  const activeSet = useMemo(() => new Set(activeCheckins.map((item) => item.employee?._id)), [activeCheckins]);

  function updateDraft(employeeId, value) {
    setDraftStatuses((prev) => ({ ...prev, [employeeId]: value }));
  }

  async function saveDailyAttendance() {
    try {
      await api.post(
        '/attendance/bulk',
        {
          date,
          records: todayRows.map((item) => ({
            employeeId: item.employee._id,
            status: draftStatuses[item.employee._id] || 'Present',
          })),
        },
        token
      );
      setSuccess('Attendance saved successfully');
      await loadAttendance();
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCheckIn(employeeId) {
    try {
      await api.post('/checkins/check-in', { employeeId, device: 'Web panel' }, token);
      setSuccess('Employee checked in');
      await loadAttendance();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCheckOut(employeeId) {
    try {
      await api.post('/checkins/check-out', { employeeId }, token);
      setSuccess('Employee checked out');
      await loadAttendance();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Layout
      title="Attendance"
      subtitle="Mark daily attendance and manage live check-in / check-out status."
    >
      {error ? <div className="alert error">{error}</div> : null}
      {success ? <div className="alert success">{success}</div> : null}

      <div className="toolbar">
        <div className="toolbar-filters">
          <label className="date-filter">
            Attendance date
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
        </div>
        <button className="button" onClick={saveDailyAttendance}>
          Save attendance
        </button>
      </div>

      <div className="content-grid">
        <section className="card">
          <div className="section-header">
            <h3>Daily attendance sheet</h3>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Live shift</th>
                </tr>
              </thead>
              <tbody>
                {todayRows.length ? (
                  todayRows.map((item) => (
                    <tr key={item.employee._id}>
                      <td>
                        <strong>{item.employee.fullName}</strong>
                        <div className="muted">{item.employee.employeeCode}</div>
                      </td>
                      <td>{item.employee.department}</td>
                      <td>
                        <select
                          value={draftStatuses[item.employee._id] || 'Present'}
                          onChange={(event) => updateDraft(item.employee._id, event.target.value)}
                        >
                          {statusOptions.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {activeSet.has(item.employee._id) ? (
                          <button className="button button-secondary" onClick={() => handleCheckOut(item.employee._id)}>
                            Check out
                          </button>
                        ) : (
                          <button className="button" onClick={() => handleCheckIn(item.employee._id)}>
                            Check in
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">No active employees to show.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="section-header">
            <h3>Active check-ins</h3>
          </div>

          <div className="feed-list">
            {activeCheckins.length ? (
              activeCheckins.map((item) => (
                <div className="feed-item" key={item._id}>
                  <div>
                    <strong>{item.employee?.fullName || 'Unknown employee'}</strong>
                    <p>
                      {item.employee?.department || '--'} • {new Date(item.checkInAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <span className="pill">On shift</span>
                </div>
              ))
            ) : (
              <p>No active check-ins right now.</p>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
