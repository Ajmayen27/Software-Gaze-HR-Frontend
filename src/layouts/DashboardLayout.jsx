import React, { useState } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import {
  LayoutDashboard, Users, Wallet, Building2,
  User, Settings, LogOut, ChevronDown,
  Briefcase, Headset, Building, UserPlus, Receipt
} from 'lucide-react';

const DashboardLayout = () => {
  const { isAuthenticated, loading, logout, role } = useAuth();
  const location = useLocation();
  const isEmployee = typeof role === 'string' && role.toUpperCase().includes('EMPLOYEE');
  const isClient = typeof role === 'string' && role.toUpperCase().includes('CLIENT');
  const isSupport = typeof role === 'string' && role.toUpperCase().includes('SUPPORT');
  const isAdminOrManager = typeof role === 'string' && (role.toUpperCase().includes('ADMIN') || role.toUpperCase().includes('MANAGER'));
  const [openMenus, setOpenMenus] = useState({ payroll: false, organization: false });

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isGroupActive = (paths) => paths.some(p => location.pathname.startsWith(p));
  const toggleMenu = (menu) => setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));

  const payrollPaths = ['/payroll', '/salary-groups'];
  const orgPaths = ['/departments', '/designations', '/locations', '/shifts'];

  // Auto-expand active groups
  if (isGroupActive(payrollPaths) && !openMenus.payroll) {
    setTimeout(() => setOpenMenus(prev => ({ ...prev, payroll: true })), 0);
  }
  if (isGroupActive(orgPaths) && !openMenus.organization) {
    setTimeout(() => setOpenMenus(prev => ({ ...prev, organization: true })), 0);
  }

  // ── Nav Components ───────────────────────────────────────────────────────────
  const NavItem = ({ to, icon: Icon, children, badge }) => (
    <Link to={to} className={`nav-item ${isActive(to) ? 'active' : ''}`}>
      <Icon size={18} className="nav-icon" />
      <span style={{ flex: 1 }}>{children}</span>
      {badge && (
        <span className="badge badge-info" style={{ fontSize: '10px', padding: '1px 6px' }}>{badge}</span>
      )}
    </Link>
  );

  const NavGroup = ({ icon: Icon, label, menuKey, paths, children }) => (
    <div>
      <div
        className={`nav-item ${isGroupActive(paths) ? 'active' : ''}`}
        onClick={() => toggleMenu(menuKey)}
      >
        <Icon size={18} className="nav-icon" />
        <span style={{ flex: 1 }}>{label}</span>
        <ChevronDown
          size={14}
          style={{
            transition: 'transform 0.2s',
            transform: openMenus[menuKey] ? 'rotate(180deg)' : 'rotate(0)',
          }}
        />
      </div>
      {openMenus[menuKey] && <div style={{ marginTop: '2px' }}>{children}</div>}
    </div>
  );

  const NavSubItem = ({ to, children }) => (
    <Link to={to} className={`nav-sub-item ${isActive(to) ? 'active' : ''}`}>
      {children}
    </Link>
  );

  const SectionLabel = ({ children }) => (
    <div className="nav-section-label">{children}</div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="app-container">
      {/* ── Sidebar ────────────────────────────────────────────────────────────── */}
      <aside className="dashboard-sidebar">
        {/* Logo */}
        <div style={{
          padding: '16px 18px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <img
            src="/logo.png"
            alt="SoftwareGaze"
            style={{ height: '32px', objectFit: 'contain' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
          <span style={{ display: 'none' }}>
            <Briefcase color="var(--primary)" size={24} />
          </span>
        </div>

        {/* Navigation */}
        <nav style={{
          flex: 1,
          padding: '12px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          overflowY: 'auto',
        }}>

          {/* ── Admin / Manager ────────────────────────────────────────────────── */}
          {isAdminOrManager && (
            <>
              <NavItem to="/dashboard" icon={LayoutDashboard}>Dashboard</NavItem>
              <NavItem to="/employees" icon={Users}>Employees</NavItem>

              <SectionLabel>Payroll</SectionLabel>
              <NavGroup icon={Wallet} label="Payroll" menuKey="payroll" paths={payrollPaths}>
                <NavSubItem to="/payroll/runs">Payroll Runs</NavSubItem>
                <NavSubItem to="/payroll/components">Salary Components</NavSubItem>
                <NavSubItem to="/salary-groups">Salary Groups</NavSubItem>
              </NavGroup>

              <SectionLabel>Finances</SectionLabel>
              <NavItem to="/expenses" icon={Receipt}>Expenses</NavItem>

              <SectionLabel>Organization</SectionLabel>
              <NavGroup icon={Building2} label="Organization" menuKey="organization" paths={orgPaths}>
                <NavSubItem to="/departments">Departments</NavSubItem>
                <NavSubItem to="/designations">Designations</NavSubItem>
                <NavSubItem to="/locations">Locations</NavSubItem>
                <NavSubItem to="/shifts">Shifts</NavSubItem>
              </NavGroup>
            </>
          )}

          {/* ── Clients Link (Visible to Admin/Manager and Support Staff) ── */}
          {(isAdminOrManager || isSupport) && (
            <NavItem to="/clients" icon={Building}>Clients</NavItem>
          )}

          {/* ── Support (Visible to Support, Admin/Manager, Client) ── */}
          {(isAdminOrManager || isSupport || isClient) && (
            <>
              <SectionLabel>Support</SectionLabel>
              {(isAdminOrManager || isSupport) && (
                <NavItem to="/support/dashboard" icon={LayoutDashboard}>Support Dashboard</NavItem>
              )}
              {role === 'ROLE_ADMIN' && (
                <NavItem to="/support-staff/register" icon={UserPlus}>Create Support Staff</NavItem>
              )}
              <NavItem to="/support/tickets" icon={Headset}>
                {isClient ? 'My Tickets' : 'Support Tickets'}
              </NavItem>
            </>
          )}

          {/* ── Bottom pinned items ─────────────────────────────────────────────── */}
          <div style={{
            marginTop: 'auto',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-color)',
          }}>
            {isEmployee && <NavItem to="/my-profile" icon={User}>My Profile</NavItem>}
            {isClient && <NavItem to="/client-profile" icon={User}>My Profile</NavItem>}
            {(isAdminOrManager || isSupport) && <NavItem to="/my-profile" icon={User}>My Profile</NavItem>}
            {isAdminOrManager && (
              <NavItem to="/settings" icon={Settings}>Settings</NavItem>
            )}
          </div>
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)' }}>
          <button
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--text-muted)', fontSize: '13px' }}
            onClick={logout}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <main className="dashboard-main">
        <header className="dashboard-header" style={{
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
          padding: '0 24px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ 
                fontWeight: 800, 
                fontSize: '15px', 
                color: 'var(--primary)', 
                letterSpacing: '-0.3px',
                fontFamily: 'var(--font-family)'
              }}>
                SoftwareGaze
              </span>
              <span style={{ 
                height: '12px', 
                width: '1px', 
                background: 'var(--border-color)' 
              }} />
              <span style={{ 
                fontSize: '13px', 
                fontWeight: 500, 
                color: 'var(--text-secondary)',
                letterSpacing: '-0.1px'
              }}>
                HR Portal
              </span>
              <span style={{
                marginLeft: '6px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--success)',
                display: 'inline-block',
                boxShadow: '0 0 0 2px rgba(22, 163, 74, 0.2)'
              }} title="Systems Operational" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {!isEmployee && !isClient && <NotificationBell />}

            {role && (
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                padding: '4px 10px',
                borderRadius: '20px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                border: '1px solid rgba(79, 70, 229, 0.15)',
                boxShadow: 'var(--shadow-sm)',
                marginRight: '4px'
              }}>
                {role.replace('ROLE_', '')}
              </span>
            )}
            
            <Link 
              to={isEmployee ? "/my-profile" : isClient ? "/client-profile" : "/my-profile"}
              style={{ display: 'flex', textDecoration: 'none' }}
            >
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
                border: '2px solid #ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.4)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(79, 70, 229, 0.25)';
              }}
              title="View Profile"
              >
                {role ? role.charAt(role.indexOf('_') + 1) || 'U' : 'U'}
              </div>
            </Link>
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
