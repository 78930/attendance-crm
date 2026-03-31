import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';
import Layout from '../components/Layout';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

function getMonthStart() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const { token } = useAuth();
  const [from, setFrom] = useState(getMonthStart());
  const [to, setTo] = useState(getToday());
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  async function loadReports() {
    try {
      const query = new URLSearchParams({ from, to }).toString();
      const response = await api.get(`/reports/attendance-summary?${query}`, token);
      setSummary(response);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadReports();
  }, [token]);

  const pieData = useMemo(
    () =>
      (summary?.statusCounts || []).map((item, index) => ({
        ...item,
        fill: ['#7c3aed', '#ef4444', '#f59e0b', '#0ea5e9', '#10b981'][index % 5],
      })),
    [summary]
  );

  async function exportCsv() {
    try {
      const query = new URLSearchParams({ from, to }).toString();
      const csv = await api.get(`/reports/export?${query}`, token);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'attendance-report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Layout title="Reports" subtitle="Analyze attendance trends, department performance, and export data.">
      {error ? <div className="alert error">{error}</div> : null}

      <div className="toolbar">
        <div className="toolbar-filters">
          <label className="date-filter">
            From
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </label>
          <label className="date-filter">
            To
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </label>
          <button className="button button-secondary" onClick={loadReports}>
            Refresh
          </button>
        </div>

        <button className="button" onClick={exportCsv}>
          Export CSV
        </button>
      </div>

      <div className="metrics-grid">
        <div className="card metric-card">
          <div className="metric-label">Attendance records</div>
          <div className="metric-value">{summary?.meta?.totalRecords ?? '--'}</div>
        </div>
        <div className="card metric-card">
          <div className="metric-label">Active employees</div>
          <div className="metric-value">{summary?.meta?.activeEmployees ?? '--'}</div>
        </div>
        <div className="card metric-card">
          <div className="metric-label">Coverage</div>
          <div className="metric-value">{summary?.meta?.coverage ? `${summary.meta.coverage}%` : '--'}</div>
        </div>
      </div>

      <div className="content-grid">
        <section className="card chart-card">
          <div className="section-header">
            <h3>Status split</h3>
          </div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label>
                  {pieData.map((entry) => (
                    <Cell key={entry.status} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card chart-card">
          <div className="section-header">
            <h3>Daily trend</h3>
          </div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={summary?.dailyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="present" stroke="#7c3aed" />
                <Line type="monotone" dataKey="absent" stroke="#ef4444" />
                <Line type="monotone" dataKey="leave" stroke="#10b981" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="content-grid">
        <section className="card chart-card">
          <div className="section-header">
            <h3>Department summary</h3>
          </div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={summary?.departmentSummary || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" fill="#7c3aed" />
                <Bar dataKey="absent" fill="#ef4444" />
                <Bar dataKey="leave" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card">
          <div className="section-header">
            <h3>Top employees by hours</h3>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Present Days</th>
                  <th>Total Hours</th>
                </tr>
              </thead>
              <tbody>
                {summary?.employeeRanking?.length ? (
                  summary.employeeRanking.map((item) => (
                    <tr key={item.employeeId}>
                      <td>
                        <strong>{item.fullName}</strong>
                        <div className="muted">{item.employeeCode}</div>
                      </td>
                      <td>{item.department}</td>
                      <td>{item.daysPresent}</td>
                      <td>{item.totalHours}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">No employee activity for this date range.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Layout>
  );
}
