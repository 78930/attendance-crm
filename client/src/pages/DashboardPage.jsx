import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import MetricCard from '../components/MetricCard';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const response = await api.get('/reports/dashboard', token);
        setData(response);
      } catch (err) {
        setError(err.message);
      }
    }

    load();
  }, [token]);

  return (
    <Layout
      title="Dashboard"
      subtitle="Quick view of active employees, current check-ins, and today's attendance."
    >
      {error ? <div className="alert error">{error}</div> : null}

      <div className="metrics-grid">
        <MetricCard label="Employees" value={data?.totals.employeeCount ?? '--'} hint="Total workforce records" />
        <MetricCard label="Active employees" value={data?.totals.activeEmployees ?? '--'} hint="Currently active" />
        <MetricCard label="Live check-ins" value={data?.totals.activeCheckins ?? '--'} hint="Still on shift" />
        <MetricCard label="Today present" value={data?.totals.todayPresent ?? '--'} hint="Marked present today" />
        <MetricCard label="Today absent" value={data?.totals.todayAbsent ?? '--'} hint="Marked absent today" />
        <MetricCard
          label="Attendance rate"
          value={data?.totals.attendanceRate ? `${data.totals.attendanceRate}%` : '--'}
          hint="Today vs active employees"
        />
      </div>

      <div className="content-grid">
        <section className="card">
          <div className="section-header">
            <h3>Recent check-ins</h3>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Check-In</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentCheckins?.length ? (
                  data.recentCheckins.map((item) => (
                    <tr key={item._id}>
                      <td>{item.employee?.fullName || 'Unknown'}</td>
                      <td>{item.employee?.department || '--'}</td>
                      <td>{new Date(item.checkInAt).toLocaleString()}</td>
                      <td>
                        <span className={`status-badge ${item.status === 'Active' ? 'active' : ''}`}>{item.status}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">No recent check-ins yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="section-header">
            <h3>Latest attendance updates</h3>
          </div>
          <div className="feed-list">
            {data?.latestAttendance?.length ? (
              data.latestAttendance.map((item) => (
                <div className="feed-item" key={item._id}>
                  <div>
                    <strong>{item.employee?.fullName || 'Unknown employee'}</strong>
                    <p>
                      {new Date(item.date).toLocaleDateString()} • {item.employee?.designation || 'Employee'}
                    </p>
                  </div>
                  <span className="pill">{item.status}</span>
                </div>
              ))
            ) : (
              <p>No attendance records available.</p>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
