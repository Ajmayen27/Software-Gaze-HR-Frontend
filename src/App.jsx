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
  const isEmployee = typeof role === 'string' && role.toUpperCase().includes('EMPLOYEE');
  const isClient   = typeof role === 'string' && role.toUpperCase().includes('CLIENT');
  if (isEmployee) return <Navigate to="/my-profile" replace />;
  if (isClient)   return <Navigate to="/support-tickets" replace />;
  return <Navigate to="/dashboard" replace />;
};

const RequireAdmin = ({ children }) => {
  const { role } = useAuth();
  const isEmployee = typeof role === 'string' && role.toUpperCase().includes('EMPLOYEE');
  const isClient   = typeof role === 'string' && role.toUpperCase().includes('CLIENT');
  
  if (isEmployee) return <Navigate to="/my-profile" replace />;
  if (isClient)   return <Navigate to="/client-profile" replace />;
  
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
          <Route path="/dashboard" element={<RequireAdmin><Dashboard /></RequireAdmin>} />

          {/* Employees */}
          <Route path="/employees" element={<RequireAdmin><EmployeeList /></RequireAdmin>} />
          <Route path="/employees/new" element={<RequireAdmin><EmployeeWizard /></RequireAdmin>} />
          <Route path="/employees/:id/profile" element={<RequireAdmin><EmployeeProfile /></RequireAdmin>} />
          <Route path="/employees/:id/edit" element={<RequireAdmin><EmployeeWizard /></RequireAdmin>} />
          <Route path="/employees/:id/documents" element={<RequireAdmin><DocumentUpload /></RequireAdmin>} />

          {/* Payroll */}
          <Route path="/payroll/runs" element={<RequireAdmin><PayrollRuns /></RequireAdmin>} />
          <Route path="/payroll/runs/:id" element={<RequireAdmin><PayrollRunDetail /></RequireAdmin>} />
          <Route path="/payroll/components" element={<RequireAdmin><SalaryComponents /></RequireAdmin>} />
          <Route path="/payroll/payslip/:id" element={<RequireAdmin><PayslipDetail /></RequireAdmin>} />

          {/* Organization Lookups */}
          <Route path="/departments" element={
            <RequireAdmin>
              <LookupPage title="Departments" subtitle="Manage organizational departments." endpoint="/departments"
                fields={[
                  { key: 'name', label: 'Name', required: true },
                  { key: 'description', label: 'Description' }
                ]} />
            </RequireAdmin>
          } />
          <Route path="/designations" element={
            <RequireAdmin>
              <LookupPage title="Designations" subtitle="Manage job designations and titles." endpoint="/designations"
                fields={[
                  { key: 'name', label: 'Name', required: true },
                  { key: 'description', label: 'Description' },
                  { key: 'departmentId', label: 'Department', required: true }
                ]}
                extraFetch={fetchDepartments} />
            </RequireAdmin>
          } />
          <Route path="/locations" element={
            <RequireAdmin>
              <LookupPage title="Locations" subtitle="Manage office locations." endpoint="/locations"
                fields={[
                  { key: 'name', label: 'Name', required: true },
                  { key: 'address', label: 'Address' },
                  { key: 'city', label: 'City' },
                  { key: 'country', label: 'Country' }
                ]} />
            </RequireAdmin>
          } />
          <Route path="/shifts" element={
            <RequireAdmin>
              <LookupPage title="Shifts" subtitle="Manage work shifts and schedules." endpoint="/shifts"
                fields={[
                  { key: 'name', label: 'Name', required: true },
                  { key: 'startTime', label: 'Start Time', type: 'time', required: true },
                  { key: 'endTime', label: 'End Time', type: 'time', required: true },
                  { key: 'description', label: 'Description' }
                ]} />
            </RequireAdmin>
          } />
          <Route path="/salary-groups" element={
            <RequireAdmin>
              <LookupPage title="Salary Groups" subtitle="Define salary structures and basic salary percentages." endpoint="/salary-groups"
                fields={[
                  { key: 'name', label: 'Name', required: true },
                  { key: 'description', label: 'Description' },
                  { key: 'basicSalaryPercentage', label: 'Basic Salary %', type: 'number', required: true }
                ]} />
            </RequireAdmin>
          } />

          {/* Clients (Admin) */}
          <Route path="/clients" element={<RequireAdmin><ClientList /></RequireAdmin>} />

          {/* Client Self-Service */}
          <Route path="/client-profile" element={<ClientProfile />} />

          {/* Support Tickets - Visible to Admin and Client */}
          <Route path="/support-tickets" element={<SupportTickets />} />
          <Route path="/support-tickets/:id" element={<TicketDetail />} />

          {/* Profile & Settings */}
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/settings" element={<RequireAdmin><Settings /></RequireAdmin>} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
};

export default App;
