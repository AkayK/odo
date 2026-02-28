import { useState, useEffect } from 'react';

const initialForm = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  roleId: '',
  departmentId: '',
};

export default function UserFormModal({ isOpen, onClose, onSubmit, user, roles, departments, isSubmitting }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const isEditMode = Boolean(user);

  useEffect(() => {
    if (user) {
      setForm({
        email: user.email,
        password: '',
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: String(user.roleId),
        departmentId: user.departmentId ? String(user.departmentId) : '',
      });
    } else {
      setForm(initialForm);
    }
    setError('');
  }, [user, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.email || !form.firstName || !form.lastName || !form.roleId) {
      return 'Email, first name, last name, and role are required';
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(form.email)) {
      return 'Invalid email format';
    }
    if (!isEditMode && !form.password) {
      return 'Password is required for new users';
    }
    if (form.password && form.password.length < 8) {
      return 'Password must be at least 8 characters with uppercase, lowercase, and a digit';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      email: form.email,
      firstName: form.firstName,
      lastName: form.lastName,
      roleId: Number(form.roleId),
      departmentId: form.departmentId ? Number(form.departmentId) : null,
    };

    if (form.password) {
      payload.password = form.password;
    }

    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="modal-title">{isEditMode ? 'Edit User' : 'Create User'}</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="user-firstName">First Name</label>
              <input id="user-firstName" type="text" name="firstName" value={form.firstName} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="user-lastName">Last Name</label>
              <input id="user-lastName" type="text" name="lastName" value={form.lastName} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="user-email">Email</label>
            <input id="user-email" type="email" name="email" value={form.email} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="user-password">{isEditMode ? 'New Password (leave blank to keep)' : 'Password'}</label>
            <input id="user-password" type="password" name="password" value={form.password} onChange={handleChange} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="user-roleId">Role</label>
              <select id="user-roleId" name="roleId" value={form.roleId} onChange={handleChange}>
                <option value="">Select role...</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="user-departmentId">Department</label>
              <select id="user-departmentId" name="departmentId" value={form.departmentId} onChange={handleChange}>
                <option value="">None</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-inline" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
