import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import UserFormModal from '../components/UserFormModal';
import { userService } from '../services/userService';

const roleLabels = {
  admin: 'Administrator',
  manager: 'Manager',
  worker: 'Worker',
};

export default function UserManagementPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError('');
      const [usersData, rolesData, deptsData] = await Promise.all([
        userService.getAll(),
        userService.getRoles(),
        userService.getDepartments(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      setDepartments(deptsData);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    if (editingUser) {
      await userService.update(editingUser.id, formData);
    } else {
      await userService.create(formData);
    }
    setSubmitting(false);
    closeModal();
    await loadData();
  };

  const handleToggleActive = async (user) => {
    const action = user.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${user.firstName} ${user.lastName}?`)) {
      return;
    }
    try {
      await userService.toggleActive(user.id);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${action} user`);
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
          <h2>User Management</h2>
        </div>
        <button className="btn-primary-inline" onClick={openCreateModal}>
          + Create User
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Department</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className={!u.isActive ? 'row-inactive' : ''}>
              <td>{u.firstName} {u.lastName}</td>
              <td>{u.email}</td>
              <td>
                <span className={`role-badge role-${u.role}`}>
                  {roleLabels[u.role] || u.role}
                </span>
              </td>
              <td>{u.department || '-'}</td>
              <td>
                <span className={`status-badge ${u.isActive ? 'status-active' : 'status-inactive'}`}>
                  {u.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="actions-cell">
                <button className="btn-sm btn-edit" onClick={() => openEditModal(u)}>
                  Edit
                </button>
                <button
                  className={`btn-sm ${u.isActive ? 'btn-toggle-off' : 'btn-toggle-on'}`}
                  onClick={() => handleToggleActive(u)}
                >
                  {u.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan="6" className="empty-state">No users found</td>
            </tr>
          )}
        </tbody>
      </table>

      <UserFormModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        user={editingUser}
        roles={roles}
        departments={departments}
        isSubmitting={submitting}
      />
    </DashboardLayout>
  );
}
