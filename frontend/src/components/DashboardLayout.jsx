import { useAuth } from '../context/AuthContext';

const roleLabels = {
  admin: 'Administrator',
  manager: 'Manager',
  worker: 'Worker',
};

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Ticket System</h1>
        <div className="header-right">
          <span className="user-info">
            {user.firstName} {user.lastName}
            <span className={`role-badge role-${user.role}`}>
              {roleLabels[user.role] || user.role}
            </span>
          </span>
          <button onClick={logout} className="btn-logout">
            Logout
          </button>
        </div>
      </header>
      <main className="dashboard-main">{children}</main>
    </div>
  );
}
