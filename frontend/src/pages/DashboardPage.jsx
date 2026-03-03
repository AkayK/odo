import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { dashboardService } from '../services/dashboardService';

const priorityLabels = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };
const statusLabels = { open: 'Open', in_progress: 'In Progress', on_hold: 'On Hold', closed: 'Closed' };

const roleLabels = { admin: 'Administrator', manager: 'Manager', worker: 'Worker' };

const priorityColors = { low: '#2e7d32', medium: '#e65100', high: '#c62828', critical: '#b71c1c' };
const statusColors = { open: '#1565c0', in_progress: '#e65100', on_hold: '#7b1fa2', closed: '#666' };

function StatCard({ label, value, accent }) {
  return (
    <div className="stat-card">
      <div className="stat-card-value" style={accent ? { color: accent } : undefined}>{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

function DistributionBar({ items, colorMap, labelMap }) {
  const total = items.reduce((sum, i) => sum + i.count, 0);
  if (total === 0) return <p className="empty-state">No data</p>;

  return (
    <div className="dist-bar-container">
      {items.map((item) => {
        const pct = Math.round((item.count / total) * 100);
        return (
          <div key={item.key} className="dist-bar-row">
            <span className="dist-bar-label">{labelMap[item.key] || item.key}</span>
            <div className="dist-bar-track">
              <div
                className="dist-bar-fill"
                style={{ width: `${pct}%`, backgroundColor: colorMap[item.key] || '#4a6cf7' }}
              />
            </div>
            <span className="dist-bar-count">{item.count}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await dashboardService.getStats();
        setStats(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
        <h2>Dashboard</h2>
        <div className="error-message">{error}</div>
      </DashboardLayout>
    );
  }

  const statusItems = ['open', 'in_progress', 'on_hold', 'closed'].map((key) => ({
    key,
    count: stats.byStatus[key] || 0,
  }));

  const priorityItems = ['low', 'medium', 'high', 'critical'].map((key) => ({
    key,
    count: stats.byPriority[key] || 0,
  }));

  const openCount = stats.byStatus.open || 0;
  const inProgressCount = stats.byStatus.in_progress || 0;

  return (
    <DashboardLayout>
      <div className="dashboard-top">
        <div>
          <h2>Dashboard</h2>
          <p className="card-detail">
            {user.firstName} {user.lastName} &middot; {roleLabels[user.role]}
            {user.department ? ` \u00b7 ${user.department}` : ''}
          </p>
        </div>
      </div>

      <div className="stat-cards-row">
        <StatCard label="Total Tickets" value={stats.total} />
        <StatCard label="Open" value={openCount} accent="#1565c0" />
        <StatCard label="In Progress" value={inProgressCount} accent="#e65100" />
        <StatCard label="Unassigned" value={stats.unassigned} accent="#c62828" />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3>By Status</h3>
          <DistributionBar items={statusItems} colorMap={statusColors} labelMap={statusLabels} />
        </div>

        <div className="card">
          <h3>By Priority</h3>
          <DistributionBar items={priorityItems} colorMap={priorityColors} labelMap={priorityLabels} />
        </div>
      </div>

      {user.role === 'admin' && stats.byDepartment && stats.byDepartment.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3>By Department</h3>
          <DistributionBar
            items={stats.byDepartment.map((d) => ({ key: d.name, count: d.count }))}
            colorMap={{}}
            labelMap={Object.fromEntries(stats.byDepartment.map((d) => [d.name, d.name]))}
          />
        </div>
      )}

      {stats.recentTickets.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3>Recent Tickets</h3>
          <table className="data-table data-table-embedded">
            <thead>
              <tr>
                <th>Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentTickets.map((t) => (
                <tr key={t.id} className="row-clickable" onClick={() => navigate(`/tickets/${t.id}`)}>
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
                  <td>{t.assignedTo || '-'}</td>
                  <td>{new Date(t.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="dashboard-cards" style={{ marginTop: '1rem' }}>
        <div className="card card-clickable" onClick={() => navigate('/tickets')}>
          <h3>View All Tickets</h3>
          <p className="card-detail">Browse, filter, and manage tickets</p>
        </div>

        {user.role === 'admin' && (
          <>
            <div className="card card-clickable" onClick={() => navigate('/admin/users')}>
              <h3>User Management</h3>
              <p className="card-detail">Create and manage system users</p>
            </div>
            <div className="card card-clickable" onClick={() => navigate('/admin/categories')}>
              <h3>Category Management</h3>
              <p className="card-detail">Manage ticket categories</p>
            </div>
            <div className="card card-clickable" onClick={() => navigate('/admin/departments')}>
              <h3>Department Management</h3>
              <p className="card-detail">Create and manage departments</p>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
