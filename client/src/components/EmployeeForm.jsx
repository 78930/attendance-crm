import { useEffect, useState } from 'react';

const initialState = {
  employeeCode: '',
  fullName: '',
  email: '',
  phone: '',
  department: '',
  designation: '',
  joinDate: '',
  status: 'Active',
  notes: '',
};

export default function EmployeeForm({ open, onClose, onSubmit, employee }) {
  const [form, setForm] = useState(initialState);

  useEffect(() => {
    if (employee) {
      setForm({
        employeeCode: employee.employeeCode || '',
        fullName: employee.fullName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        department: employee.department || '',
        designation: employee.designation || '',
        joinDate: employee.joinDate ? employee.joinDate.slice(0, 10) : '',
        status: employee.status || 'Active',
        notes: employee.notes || '',
      });
    } else {
      setForm(initialState);
    }
  }, [employee]);

  if (!open) return null;

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(form);
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h3>{employee ? 'Edit employee' : 'Add employee'}</h3>
          <button className="icon-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Employee Code
            <input value={form.employeeCode} onChange={(e) => updateField('employeeCode', e.target.value)} />
          </label>
          <label>
            Full Name
            <input required value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} />
          </label>
          <label>
            Phone
            <input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} />
          </label>
          <label>
            Department
            <input value={form.department} onChange={(e) => updateField('department', e.target.value)} />
          </label>
          <label>
            Designation
            <input value={form.designation} onChange={(e) => updateField('designation', e.target.value)} />
          </label>
          <label>
            Join Date
            <input type="date" required value={form.joinDate} onChange={(e) => updateField('joinDate', e.target.value)} />
          </label>
          <label>
            Status
            <select value={form.status} onChange={(e) => updateField('status', e.target.value)}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </label>
          <label className="full-span">
            Notes
            <textarea rows="4" value={form.notes} onChange={(e) => updateField('notes', e.target.value)} />
          </label>

          <div className="modal-actions full-span">
            <button type="button" className="button button-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button">
              {employee ? 'Save changes' : 'Create employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
