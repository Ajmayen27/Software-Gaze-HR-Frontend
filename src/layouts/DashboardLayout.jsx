import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import ClientNotificationBell from '../components/ClientNotificationBell';
import logo from '../assets/Logo_SG-removebg-preview.png';
import {
  LayoutDashboard, Users, Wallet, Building2,
  User, Settings, LogOut, ChevronDown,
  Briefcase, Headset, Building, UserPlus, Receipt, Clock, Calendar
} from 'lucide-react';

const DashboardLayout = () => {
  const { isAuthenticated, loading, logout, role } = useAuth();
  const location = useLocation();
  const isEmployee = typeof role === 'string' && role.toUpperCase().includes('EMPLOYEE');
  const isClient = typeof role === 'string' && role.toUpperCase().includes('CLIENT');
  const isSupport = typeof role === 'string' && role.toUpperCase().includes('SUPPORT');
  const isAdminOrManager = typeof role === 'string' && (role.toUpperCase().includes('ADMIN') || role.toUpperCase().includes('MANAGER'));
  const [openMenus, setOpenMenus] = useState({ payroll: false, organization: false });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (loading) return null;
  if (!isAuthenticated || !role) return <Navigate to="/login" replace />;

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
          padding: '18px 20px 16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05), rgba(14, 165, 233, 0.05))',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.9)',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
          }}>
            <img
              src={logo}
              alt="SoftwareGaze"
              style={{ height: '42px', width: '42px', objectFit: 'contain' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>SoftwareGaze</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>HR Platform</span>
          </div>
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
                <NavItem to="/support-staff/register" icon={UserPlus}>Support Staff</NavItem>
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
        <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={logout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid transparent',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'var(--danger-light)';
              e.currentTarget.style.color = 'var(--danger)';
              e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.12)';
              e.currentTarget.querySelector('svg').style.transform = 'translateX(-2px)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.querySelector('svg').style.transform = 'none';
            }}
          >
            <LogOut size={16} style={{ transition: 'transform 0.2s ease' }} />
            <span style={{ fontWeight: 600 }}>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <main className="dashboard-main">
        <header className="dashboard-header" style={{
          background: '#FFFFFF',
          borderBottom: '1px solid var(--border-color)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          padding: '0 24px',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: '100%' }}>
            {/* Left Section - Branding */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ 
                  fontWeight: 700, 
                  fontSize: '15px', 
                  color: 'var(--primary)', 
                  letterSpacing: '-0.3px',
                  fontFamily: 'var(--font-family)'
                }}>
                  SoftwareGaze
                </span>
                <span style={{ 
                  height: '16px', 
                  width: '1px', 
                  background: 'var(--border-color)' 
                }} />
                <span style={{ 
                  fontSize: '13px', 
                  fontWeight: 500, 
                  color: 'var(--text-secondary)',
                  letterSpacing: '-0.1px'
                }}>
                  HR Platform
                </span>
              </div>
            </div>

            {/* Right Section - Actions & Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', justifyContent: 'flex-end' }}>
              {/* Live Clock and Calendar - Industry Standard */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                paddingLeft: '24px',
                borderLeft: '1px solid var(--border-color)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Clock size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: 500, 
                    color: 'var(--text-secondary)',
                    fontFamily: 'monospace',
                    letterSpacing: '0.5px',
                    minWidth: '70px'
                  }}>
                    {formatTime(currentTime)}
                  </span>
                </div>

                <span style={{ width: '1px', height: '16px', background: 'var(--border-color)' }} />

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Calendar size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: 500, 
                    color: 'var(--text-secondary)',
                    minWidth: '85px'
                  }}>
                    {formatDate(currentTime)}
                  </span>
                </div>
              </div>

            {isClient ? <ClientNotificationBell /> : (!isEmployee && <NotificationBell />)}

              {role && (
                <span style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  border: '1px solid rgba(79, 70, 229, 0.2)',
                  whiteSpace: 'nowrap'
                }}>
                  {role.replace('ROLE_', '')}
                </span>
              )}
              
              <Link 
                to={isEmployee ? "/my-profile" : isClient ? "/client-profile" : "/my-profile"}
                style={{ display: 'flex', textDecoration: 'none' }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(79, 70, 229, 0.2)',
                  border: '2px solid #ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
                onMouseOver={e => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.3)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(79, 70, 229, 0.2)';
                }}
                title="View Profile"
                >
                  {role ? role.charAt(role.indexOf('_') + 1) || 'U' : 'U'}
                </div>
              </Link>
            </div>
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
