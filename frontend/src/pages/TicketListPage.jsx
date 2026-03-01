import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { ticketService } from '../services/ticketService';
import { categoryService } from '../services/categoryService';

const priorityLabels = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };
const statusLabels = { open: 'Open', in_progress: 'In Progress', on_hold: 'On Hold', closed: 'Closed' };

const initialForm = {
  title: '',
  description: '',
  categoryId: '',
  priority: 'medium',
};

function CreateTicketModal({ isOpen, onClose, onSubmit, categories, isSubmitting }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm(initialForm);
      setError('');
    }
  }, [isOpen]);

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
    if (!form.title || form.title.trim().length < 3) {
      return 'Title must be at least 3 characters';
    }
    if (!form.categoryId) {
      return 'Category is required';
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

    try {
      await onSubmit({
        title: form.title.trim(),
        description: form.description.trim() || null,
        categoryId: Number(form.categoryId),
        priority: form.priority,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  const activeCategories = categories.filter((c) => c.isActive);

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="modal-title">Create Ticket</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="ticket-title">Title</label>
            <input id="ticket-title" type="text" name="title" value={form.title} onChange={handleChange} maxLength={255} />
          </div>

          <div className="form-group">
            <label htmlFor="ticket-description">Description</label>
            <textarea id="ticket-description" name="description" value={form.description} onChange={handleChange} rows="4" maxLength={2000} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ticket-categoryId">Category</label>
              <select id="ticket-categoryId" name="categoryId" value={form.categoryId} onChange={handleChange}>
                <option value="">Select category...</option>
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="ticket-priority">Priority</label>
              <select id="ticket-priority" name="priority" value={form.priority} onChange={handleChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-inline" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TicketListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const loadData = useCallback(async () => {
    try {
      setError('');
      const [ticketsData, categoriesData] = await Promise.all([
        ticketService.getAll(),
        categoryService.getAll(),
      ]);
      setTickets(ticketsData);
      setCategories(categoriesData);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (formData) => {
    setSubmitting(true);
    try {
      await ticketService.create(formData);
      setModalOpen(false);
      await loadData();
    } catch (err) {
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

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
          <h2>Tickets</h2>
        </div>
        <button className="btn-primary-inline" onClick={() => setModalOpen(true)}>
          + Create Ticket
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filter-bar">
        <div className="form-group filter-group">
          <label htmlFor="filter-status">Status</label>
          <select id="filter-status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All</option>
            {Object.entries(statusLabels).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <div className="form-group filter-group">
          <label htmlFor="filter-priority">Priority</label>
          <select id="filter-priority" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="">All</option>
            {Object.entries(priorityLabels).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <span className="filter-count">{filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}</span>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Category</th>
            <th>Assigned To</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {filteredTickets.map((t) => (
            <tr
              key={t.id}
              className="row-clickable"
              onClick={() => navigate(`/tickets/${t.id}`)}
            >
              <td>{t.title}</td>
              <td>
                <span className={`priority-badge priority-${t.priority}`}>
                  {priorityLabels[t.priority]}
                </span>
              </td>
              <td>
                <span className={`ticket-status-badge ticket-status-${t.status}`}>
                  {statusLabels[t.status]}
                </span>
              </td>
              <td>{t.category.name}</td>
              <td>
                {t.assignedTo
                  ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}`
                  : '-'}
              </td>
              <td>{new Date(t.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
          {filteredTickets.length === 0 && (
            <tr>
              <td colSpan="6" className="empty-state">No tickets found</td>
            </tr>
          )}
        </tbody>
      </table>

      <CreateTicketModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        categories={categories}
        isSubmitting={submitting}
      />
    </DashboardLayout>
  );
}
