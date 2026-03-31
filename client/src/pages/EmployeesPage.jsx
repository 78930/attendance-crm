import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import EmployeeForm from '../components/EmployeeForm';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function EmployeesPage() {
  const { token } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  async function loadEmployees() {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (department) params.set('department', department);
      if (status) params.set('status', status);

      const response = await api.get(`/employees?${params.toString()}`, token);
      setEmployees(response);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, [token]);

  const departments = useMemo(
    () => [...new Set(employees.map((employee) => employee.department).filter(Boolean))],
    [employees]
  );

  async function handleSave(payload) {
    try {
      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee._id}`, payload, token);
      } else {
        await api.post('/employees', payload, token);
      }
      setShowForm(false);
      setEditingEmployee(null);
      await loadEmployees();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(employeeId) {
    const confirmed = window.confirm('Delete this employee and related attendance records?');
    if (!confirmed) return;

    try {
      await api.delete(`/employees/${employeeId}`, token);
      await loadEmployees();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Layout title="Employees" subtitle="Create, edit, search, and organize employee records.">
      <div className="toolbar">
        <div className="toolbar-filters">
          <input
            placeholder="Search by name, code, email, designation..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select value={department} onChange={(event) => setDepartment(event.target.value)}>
            <option value="">All departments</option>
            {departments.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
          <button className="button button-secondary" onClick={loadEmployees}>
            Apply
          </button>
        </div>

        <button
          className="button"
          onClick={() => {
            setEditingEmployee(null);
            setShowForm(true);
          }}
        >
          Add employee
        </button>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      <section className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Checked In</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {employees.length ? (
                employees.map((employee) => (
                  <tr key={employee._id}>
                    <td>{employee.employeeCode}</td>
                    <td>
                      <strong>{employee.fullName}</strong>
                      <div className="muted">{employee.email || '--'}</div>
                    </td>
                    <td>{employee.department || '--'}</td>
                    <td>{employee.designation || '--'}</td>
                    <td>{employee.phone || '--'}</td>
                    <td>
                      <span className={`status-badge ${employee.status === 'Active' ? 'active' : ''}`}>
                        {employee.status}
                      </span>
                    </td>
                    <td>{employee.isCheckedIn ? 'Yes' : 'No'}</td>
                    <td>
                      <div className="inline-actions">
                        <button
                          className="text-button"
                          onClick={() => {
                            setEditingEmployee(employee);
                            setShowForm(true);
                          }}
                        >
                          Edit
                        </button>
                        <button className="text-button danger" onClick={() => handleDelete(employee._id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8">No employees found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <EmployeeForm
        open={showForm}
        employee={editingEmployee}
        onClose={() => {
          setShowForm(false);
          setEditingEmployee(null);
        }}
        onSubmit={handleSave}
      />
    </Layout>
  );
}
