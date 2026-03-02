import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { departmentService } from '../services/departmentService';

const initialForm = {
  name: '',
  description: '',
};

function DepartmentFormModal({ isOpen, onClose, onSubmit, department, isSubmitting }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const isEditMode = Boolean(department);

  useEffect(() => {
    if (department) {
      setForm({
        name: department.name,
        description: department.description || '',
      });
    } else {
      setForm(initialForm);
    }
    setError('');
  }, [department, isOpen]);

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
    if (!form.name || form.name.trim().length < 2) {
      return 'Department name must be at least 2 characters';
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
      name: form.name.trim(),
      description: form.description.trim() || null,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="modal-title">{isEditMode ? 'Edit Department' : 'Create Department'}</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="dept-name">Name</label>
            <input id="dept-name" type="text" name="name" value={form.name} onChange={handleChange} maxLength={100} />
          </div>

          <div className="form-group">
            <label htmlFor="dept-description">Description</label>
            <textarea id="dept-description" name="description" value={form.description} onChange={handleChange} rows="3" maxLength={255} />
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

export default function DepartmentManagementPage() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError('');
      const data = await departmentService.getAll();
      setDepartments(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setEditingDepartment(null);
    setModalOpen(true);
  };

  const openEditModal = (department) => {
    setEditingDepartment(department);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingDepartment(null);
  };

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    try {
      if (editingDepartment) {
        await departmentService.update(editingDepartment.id, formData);
      } else {
        await departmentService.create(formData);
      }
      closeModal();
      await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (department) => {
    const action = department.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} "${department.name}"?`)) {
      return;
    }
    try {
      await departmentService.toggleActive(department.id);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${action} department`);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn-back" onClick={() => navigate('/dashboard')}>
            &larr; Back
          </button>
          <h2>Department Management</h2>
        </div>
        <button className="btn-primary-inline" onClick={openCreateModal}>
          + Create Department
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {departments.map((d) => (
            <tr key={d.id} className={!d.isActive ? 'row-inactive' : ''}>
              <td>{d.name}</td>
              <td>{d.description || '-'}</td>
              <td>
                <span className={`status-badge ${d.isActive ? 'status-active' : 'status-inactive'}`}>
                  {d.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="actions-cell">
                <button className="btn-sm btn-edit" onClick={() => openEditModal(d)}>
                  Edit
                </button>
                <button
                  className={`btn-sm ${d.isActive ? 'btn-toggle-off' : 'btn-toggle-on'}`}
                  onClick={() => handleToggleActive(d)}
                >
                  {d.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
          {departments.length === 0 && (
            <tr>
              <td colSpan="4" className="empty-state">No departments found</td>
            </tr>
          )}
        </tbody>
      </table>

      <DepartmentFormModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        department={editingDepartment}
        isSubmitting={submitting}
      />
    </DashboardLayout>
  );
}
