import React from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, LogOut, Briefcase, Settings as SettingsIcon, User } from 'lucide-react';

const DashboardLayout = () => {
  const { isAuthenticated, loading, logout, role } = useAuth();
  const location = useLocation();
  const isEmployee = typeof role === 'string' && role.toUpperCase().includes('EMPLOYEE');

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const isActive = (path) => location.pathname.startsWith(path) ? 'var(--primary)' : 'var(--text-muted)';

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Briefcase color="var(--primary)" size={28} />
          <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 600 }}>SoftwareGaze HR</h2>
        </div>
        <nav style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {!isEmployee && (
            <Link to="/employees" style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px',
              backgroundColor: location.pathname.startsWith('/employees') ? 'rgba(110,86,207,0.1)' : 'transparent',
              color: isActive('/employees'),
              fontWeight: location.pathname.startsWith('/employees') ? 600 : 400
            }}>
              <Users size={20} />
              Directory
            </Link>
          )}
          
          {isEmployee && (
            <Link to="/my-profile" style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px',
              backgroundColor: location.pathname.startsWith('/my-profile') ? 'rgba(110,86,207,0.1)' : 'transparent',
              color: isActive('/my-profile'),
              fontWeight: location.pathname.startsWith('/my-profile') ? 600 : 400
            }}>
              <User size={20} />
              My Profile
            </Link>
          )}
          
          {!isEmployee && (
            <Link to="/settings" style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px',
              backgroundColor: location.pathname.startsWith('/settings') ? 'rgba(110,86,207,0.1)' : 'transparent',
              color: isActive('/settings'),
              fontWeight: location.pathname.startsWith('/settings') ? 600 : 400
            }}>
              <SettingsIcon size={20} />
              Settings
            </Link>
          )}
        </nav>
        <div style={{ padding: '24px 16px', borderTop: '1px solid var(--glass-border)' }}>
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--text-muted)' }} onClick={logout}>
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="dashboard-header animate-fade-in">
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-muted)' }}>Overview</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Profile Avatar Mock */}
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}></div>
          </div>
        </header>

        <section className="dashboard-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default DashboardLayout;
