import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { ticketService } from '../services/ticketService';
import { categoryService } from '../services/categoryService';
import { userService } from '../services/userService';

const priorityLabels = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };
const statusLabels = { open: 'Open', in_progress: 'In Progress', on_hold: 'On Hold', closed: 'Closed' };

const VALID_TRANSITIONS = {
  open: ['in_progress', 'closed'],
  in_progress: ['on_hold', 'closed'],
  on_hold: ['in_progress'],
  closed: [],
};

function fieldLabel(field) {
  const map = {
    title: 'Title',
    description: 'Description',
    priority: 'Priority',
    status: 'Status',
    category_id: 'Category',
    assigned_to: 'Assigned To',
  };
  return map[field] || field;
}

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [history, setHistory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', categoryId: '', priority: '' });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const isAdminOrManager = user.role === 'admin' || user.role === 'manager';
  const isWorker = user.role === 'worker';

  const loadData = useCallback(async () => {
    try {
      setError('');
      const [ticketData, historyData, categoriesData] = await Promise.all([
        ticketService.getById(id),
        ticketService.getHistory(id),
        categoryService.getAll(),
      ]);
      setTicket(ticketData);
      setHistory(historyData);
      setCategories(categoriesData);

      if (isAdminOrManager) {
        try {
          const usersData = await userService.getAll();
          setUsers(usersData.filter((u) => u.isActive));
        } catch {
          setUsers([]);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  }, [id, isAdminOrManager]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (newStatus) => {
    setActionError('');
    try {
      const updated = await ticketService.changeStatus(id, newStatus);
      setTicket(updated);
      const updatedHistory = await ticketService.getHistory(id);
      setHistory(updatedHistory);
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to change status');
    }
  };

  const handleAssign = async (e) => {
    const assignedTo = e.target.value ? Number(e.target.value) : null;
    setActionError('');
    try {
      const updated = await ticketService.assign(id, assignedTo);
      setTicket(updated);
      const updatedHistory = await ticketService.getHistory(id);
      setHistory(updatedHistory);
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to assign ticket');
    }
  };

  const startEditing = () => {
    setEditing(true);
    setEditForm({
      title: ticket.title,
      description: ticket.description || '',
      categoryId: String(ticket.category.id),
      priority: ticket.priority,
    });
    setActionError('');
  };

  const cancelEditing = () => {
    setEditing(false);
    setActionError('');
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) {
      setActionError('Title is required');
      return;
    }
    setEditSubmitting(true);
    setActionError('');
    try {
      const payload = {};
      if (editForm.title.trim() !== ticket.title) payload.title = editForm.title.trim();
      if ((editForm.description || null) !== (ticket.description || null)) {
        payload.description = editForm.description.trim() || null;
      }
      if (Number(editForm.categoryId) !== ticket.category.id) payload.categoryId = Number(editForm.categoryId);
      if (editForm.priority !== ticket.priority) payload.priority = editForm.priority;

      if (Object.keys(payload).length === 0) {
        setEditing(false);
        return;
      }

      const updated = await ticketService.update(id, payload);
      setTicket(updated);
      setEditing(false);
      const updatedHistory = await ticketService.getHistory(id);
      setHistory(updatedHistory);
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to update ticket');
    } finally {
      setEditSubmitting(false);
    }
  };

  const canEdit = ticket && ticket.status !== 'closed' && (
    isAdminOrManager ||
    ticket.createdBy.id === user.id ||
    (ticket.assignedTo && ticket.assignedTo.id === user.id)
  );

  const allowedTransitions = ticket ? (VALID_TRANSITIONS[ticket.status] || []) : [];
  const visibleTransitions = isWorker
    ? allowedTransitions.filter((s) => s !== 'closed')
    : allowedTransitions;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading">Loading...</div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="page-header">
          <div className="page-header-left">
            <button className="btn-back" onClick={() => navigate('/tickets')}>&larr; Back</button>
            <h2>Ticket Detail</h2>
          </div>
        </div>
        <div className="error-message">{error}</div>
      </DashboardLayout>
    );
  }

  const activeCategories = categories.filter((c) => c.isActive || c.id === ticket.category.id);

  return (
    <DashboardLayout>
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn-back" onClick={() => navigate('/tickets')}>&larr; Back</button>
          <h2>Ticket #{ticket.id}</h2>
        </div>
        {canEdit && !editing && (
          <button className="btn-primary-inline" onClick={startEditing}>Edit</button>
        )}
      </div>

      {actionError && <div className="error-message">{actionError}</div>}

      <div className="ticket-detail-grid">
        <div className="ticket-main">
          {editing ? (
            <form className="card ticket-edit-form" onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label htmlFor="edit-title">Title</label>
                <input id="edit-title" type="text" name="title" value={editForm.title} onChange={handleEditChange} maxLength={255} />
              </div>
              <div className="form-group">
                <label htmlFor="edit-description">Description</label>
                <textarea id="edit-description" name="description" value={editForm.description} onChange={handleEditChange} rows="5" maxLength={2000} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-categoryId">Category</label>
                  <select id="edit-categoryId" name="categoryId" value={editForm.categoryId} onChange={handleEditChange}>
                    {activeCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.department})</option>
                    ))}
                  </select>
                </div>
                {!isWorker && (
                  <div className="form-group">
                    <label htmlFor="edit-priority">Priority</label>
                    <select id="edit-priority" name="priority" value={editForm.priority} onChange={handleEditChange}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={cancelEditing} disabled={editSubmitting}>Cancel</button>
                <button type="submit" className="btn-primary-inline" disabled={editSubmitting}>
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="card">
              <h3 className="ticket-title">{ticket.title}</h3>
              <p className="ticket-description">{ticket.description || 'No description provided.'}</p>
            </div>
          )}

          <div className="card">
            <h3>History</h3>
            {history.length === 0 ? (
              <p className="empty-state">No history yet</p>
            ) : (
              <div className="history-timeline">
                {history.map((h) => (
                  <div key={h.id} className="history-entry">
                    <div className="history-header">
                      <span className="history-user">{h.changedBy.firstName} {h.changedBy.lastName}</span>
                      <span className="history-date">{new Date(h.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="history-change">
                      Changed <strong>{fieldLabel(h.fieldChanged)}</strong>
                      {h.oldValue && <> from <span className="history-old">{h.oldValue}</span></>}
                      {h.newValue && <> to <span className="history-new">{h.newValue}</span></>}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="ticket-sidebar">
          <div className="card">
            <h4>Status</h4>
            <span className={`ticket-status-badge ticket-status-${ticket.status}`}>
              {statusLabels[ticket.status]}
            </span>
            {visibleTransitions.length > 0 && (
              <div className="status-actions">
                {visibleTransitions.map((s) => (
                  <button
                    key={s}
                    className={`btn-sm btn-status btn-status-${s}`}
                    onClick={() => handleStatusChange(s)}
                  >
                    {statusLabels[s]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h4>Priority</h4>
            <span className={`priority-badge priority-${ticket.priority}`}>
              {priorityLabels[ticket.priority]}
            </span>
          </div>

          <div className="card">
            <h4>Category</h4>
            <p>{ticket.category.name}</p>
            <p className="card-detail">{ticket.department.name}</p>
          </div>

          <div className="card">
            <h4>Created By</h4>
            <p>{ticket.createdBy.firstName} {ticket.createdBy.lastName}</p>
            <p className="card-detail">{ticket.createdBy.email}</p>
          </div>

          <div className="card">
            <h4>Assigned To</h4>
            {isAdminOrManager && ticket.status !== 'closed' ? (
              <select
                className="assign-select"
                value={ticket.assignedTo?.id || ''}
                onChange={handleAssign}
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </select>
            ) : (
              <p>
                {ticket.assignedTo
                  ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`
                  : 'Unassigned'}
              </p>
            )}
          </div>

          <div className="card">
            <h4>Dates</h4>
            <p className="card-detail">Created: {new Date(ticket.createdAt).toLocaleString()}</p>
            <p className="card-detail">Updated: {new Date(ticket.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
