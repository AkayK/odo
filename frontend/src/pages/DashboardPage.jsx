import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';

const roleLabels = {
  admin: 'Administrator',
  manager: 'Manager',
  worker: 'Worker',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <h2>Dashboard</h2>
      <div className="dashboard-cards">
        <div className="card">
          <h3>Welcome</h3>
          <p>
            {user.firstName} {user.lastName}
          </p>
          <p className="card-detail">Role: {roleLabels[user.role]}</p>
          {user.department && (
            <p className="card-detail">Department: {user.department}</p>
          )}
        </div>

        {user.role === 'admin' && (
          <>
            <div
              className="card card-clickable"
              onClick={() => navigate('/admin/users')}
            >
              <h3>User Management</h3>
              <p className="card-detail">Create and manage system users</p>
            </div>
            <div
              className="card card-clickable"
              onClick={() => navigate('/admin/categories')}
            >
              <h3>Category Management</h3>
              <p className="card-detail">Manage ticket categories</p>
            </div>
          </>
        )}

        {user.role === 'manager' && (
          <div
            className="card card-clickable"
            onClick={() => navigate('/tickets')}
          >
            <h3>My Department Tickets</h3>
            <p className="card-detail">
              View and manage tickets for {user.department || 'your department'}
            </p>
          </div>
        )}

        <div
          className="card card-clickable"
          onClick={() => navigate('/tickets')}
        >
          <h3>Tickets</h3>
          <p className="card-detail">View and create tickets</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
