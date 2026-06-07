import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/EmployeeList';
import EmployeeProfile from './pages/EmployeeProfile';
import EmployeeWizard from './pages/wizard/EmployeeWizard';
import DocumentUpload from './pages/DocumentUpload';
import Settings from './pages/Settings';
import MyProfile from './pages/MyProfile';
import LookupPage from './pages/LookupPage';
import SalaryComponents from './pages/payroll/SalaryComponents';
import PayrollRuns from './pages/payroll/PayrollRuns';
import PayrollRunDetail from './pages/payroll/PayrollRunDetail';
import PayslipDetail from './pages/payroll/PayslipDetail';
import ClientList from './pages/clients/ClientList';
import ClientProfile from './pages/clients/ClientProfile';
import SupportDashboard from './pages/support/SupportDashboard';
import RegisterSupportStaff from './pages/support/RegisterSupportStaff';
import SupportTickets from './pages/support/SupportTickets';
import TicketDetail from './pages/support/TicketDetail';
import { useAuth } from './context/AuthContext';
import { axiosInstance } from './api/axiosInstance';
import { Toaster } from 'react-hot-toast';

// Helper: fetch departments for designation lookup
const fetchDepartments = async () => {
  try {
    const res = await axiosInstance.get('/departments');
    const list = Array.isArray(res) ? res : (res?.data || []);
    return { departments: Array.isArray(list) ? list : [] };
  } catch { return { departments: [] }; }
};

const RootRedirect = () => {
  const { role } = useAuth();
  if (!role) return <Navigate to="/login" replace />;
  const roleUpper = typeof role === 'string' ? role.toUpperCase() : '';
  if (roleUpper.includes('SUPPORT'))  return <Navigate to="/support/tickets" replace />;
  if (roleUpper.includes('EMPLOYEE')) return <Navigate to="/my-profile" replace />;
  if (roleUpper.includes('CLIENT'))   return <Navigate to="/support-tickets" replace />;
  return <Navigate to="/dashboard" replace />;
};

// Guard for HR and Payroll operations (Admin, Manager only)
const RequireHrPayroll = ({ children }) => {
  const { role } = useAuth();
  const roleUpper = typeof role === 'string' ? role.toUpperCase() : '';
  const canAccess = roleUpper.includes('ADMIN') || roleUpper.includes('MANAGER');
  
  if (!canAccess) {
    if (roleUpper.includes('SUPPORT'))  return <Navigate to="/support/tickets" replace />;
    if (roleUpper.includes('CLIENT'))   return <Navigate to="/support-tickets" replace />;
    if (roleUpper.includes('EMPLOYEE')) return <Navigate to="/my-profile" replace />;
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Guard for Client Management (Admin, Support Staff only)
const RequireClientManagement = ({ children }) => {
  const { role } = useAuth();
  const roleUpper = typeof role === 'string' ? role.toUpperCase() : '';
  const canAccess = roleUpper.includes('ADMIN') || roleUpper.includes('SUPPORT');
  
  if (!canAccess) {
    if (roleUpper.includes('CLIENT'))   return <Navigate to="/support-tickets" replace />;
    if (roleUpper.includes('EMPLOYEE')) return <Navigate to="/my-profile" replace />;
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Guard for Support Tickets Area (Admin, Manager, Support Staff, Client)
const RequireSupportStaffArea = ({ children }) => {
  const { role } = useAuth();
  const roleUpper = typeof role === 'string' ? role.toUpperCase() : '';
  const canAccess = roleUpper.includes('ADMIN') || roleUpper.includes('MANAGER') || roleUpper.includes('SUPPORT') || roleUpper.includes('CLIENT');
  
  if (!canAccess) {
    if (roleUpper.includes('EMPLOYEE')) return <Navigate to="/my-profile" replace />;
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Guard for Admin Only operations
const RequireAdmin = ({ children }) => {
  const { role } = useAuth();
  const roleUpper = typeof role === 'string' ? role.toUpperCase() : '';
  const canAccess = roleUpper === 'ROLE_ADMIN';
  
  if (!canAccess) {
    if (roleUpper.includes('SUPPORT'))  return <Navigate to="/support/tickets" replace />;
    if (roleUpper.includes('CLIENT'))   return <Navigate to="/support-tickets" replace />;
    if (roleUpper.includes('EMPLOYEE')) return <Navigate to="/my-profile" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const App = () => {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#fff',
            color: '#0F172A',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            fontSize: '13px',
          }
        }}
      />
      <Routes>
        {/* Auth */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Dashboard */}
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/dashboard" element={<RequireHrPayroll><Dashboard /></RequireHrPayroll>} />

          {/* Employees */}
          <Route path="/employees" element={<RequireHrPayroll><EmployeeList /></RequireHrPayroll>} />
          <Route path="/employees/new" element={<RequireHrPayroll><EmployeeWizard /></RequireHrPayroll>} />
          <Route path="/employees/:id/profile" element={<RequireHrPayroll><EmployeeProfile /></RequireHrPayroll>} />
          <Route path="/employees/:id/edit" element={<RequireHrPayroll><EmployeeWizard /></RequireHrPayroll>} />
          <Route path="/employees/:id/documents" element={<RequireHrPayroll><DocumentUpload /></RequireHrPayroll>} />

          {/* Payroll */}
          <Route path="/payroll/runs" element={<RequireHrPayroll><PayrollRuns /></RequireHrPayroll>} />
          <Route path="/payroll/runs/:id" element={<RequireHrPayroll><PayrollRunDetail /></RequireHrPayroll>} />
          <Route path="/payroll/components" element={<RequireHrPayroll><SalaryComponents /></RequireHrPayroll>} />
          <Route path="/payroll/payslip/:id" element={<RequireHrPayroll><PayslipDetail /></RequireHrPayroll>} />

          {/* Organization Lookups */}
          <Route path="/departments" element={
            <RequireHrPayroll>
              <LookupPage title="Departments" subtitle="Manage organizational departments." endpoint="/departments"
                fields={[
                  { key: 'name', label: 'Name', required: true },
                  { key: 'description', label: 'Description' }
                ]} />
            </RequireHrPayroll>
          } />
          <Route path="/designations" element={
            <RequireHrPayroll>
              <LookupPage title="Designations" subtitle="Manage job designations and titles." endpoint="/designations"
                fields={[
                  { key: 'name', label: 'Name', required: true },
                  { key: 'description', label: 'Description' },
                  { key: 'departmentId', label: 'Department', required: true }
                ]}
                extraFetch={fetchDepartments} />
            </RequireHrPayroll>
          } />
          <Route path="/locations" element={
            <RequireHrPayroll>
              <LookupPage title="Locations" subtitle="Manage office locations." endpoint="/locations"
                fields={[
                  { key: 'name', label: 'Name', required: true },
                  { key: 'address', label: 'Address' },
                  { key: 'city', label: 'City' },
                  { key: 'country', label: 'Country' }
                ]} />
            </RequireHrPayroll>
          } />
          <Route path="/shifts" element={
            <RequireHrPayroll>
              <LookupPage title="Shifts" subtitle="Manage work shifts and schedules." endpoint="/shifts"
                fields={[
                  { key: 'name', label: 'Name', required: true },
                  { key: 'startTime', label: 'Start Time', type: 'time', required: true },
                  { key: 'endTime', label: 'End Time', type: 'time', required: true },
                  { key: 'description', label: 'Description' }
                ]} />
            </RequireHrPayroll>
          } />
          <Route path="/salary-groups" element={
            <RequireHrPayroll>
              <LookupPage title="Salary Groups" subtitle="Define salary structures and basic salary percentages." endpoint="/salary-groups"
                fields={[
                  { key: 'name', label: 'Name', required: true },
                  { key: 'description', label: 'Description' },
                  { key: 'basicSalaryPercentage', label: 'Basic Salary %', type: 'number', required: true }
                ]} />
            </RequireHrPayroll>
          } />

          {/* Clients (Admin and Support Staff) */}
          <Route path="/clients" element={<RequireClientManagement><ClientList /></RequireClientManagement>} />

          {/* Client Self-Service */}
          <Route path="/client-profile" element={<ClientProfile />} />

          {/* Support Dashboard */}
          <Route path="/support/dashboard" element={<RequireSupportStaffArea><SupportDashboard /></RequireSupportStaffArea>} />

          {/* Register Support Staff (Admin only) */}
          <Route path="/support-staff/register" element={<RequireAdmin><RegisterSupportStaff /></RequireAdmin>} />

          {/* Support Tickets */}
          <Route path="/support/tickets" element={<RequireSupportStaffArea><SupportTickets /></RequireSupportStaffArea>} />
          <Route path="/support/tickets/:id" element={<RequireSupportStaffArea><TicketDetail /></RequireSupportStaffArea>} />

          {/* Support Tickets - Deprecated URL mapping for backward compatibility */}
          <Route path="/support-tickets" element={<RequireSupportStaffArea><SupportTickets /></RequireSupportStaffArea>} />
          <Route path="/support-tickets/:id" element={<RequireSupportStaffArea><TicketDetail /></RequireSupportStaffArea>} />

          {/* Profile & Settings */}
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/settings" element={<RequireHrPayroll><Settings /></RequireHrPayroll>} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
};

export default App;
