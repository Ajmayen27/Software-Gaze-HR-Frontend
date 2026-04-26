import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import EmployeeList from './pages/EmployeeList';
import EmployeeProfile from './pages/EmployeeProfile';
import EmployeeWizard from './pages/wizard/EmployeeWizard';
import DocumentUpload from './pages/DocumentUpload';
import Settings from './pages/Settings';
import MyProfile from './pages/MyProfile';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

const RootRedirect = () => {
  const { role } = useAuth();
  const isEmployee = typeof role === 'string' && role.toUpperCase().includes('EMPLOYEE');
  return <Navigate to={isEmployee ? "/my-profile" : "/employees"} replace />;
};

const App = () => {
  return (
    <>
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          style: { 
            background: 'var(--input-bg)', 
            color: '#fff', 
            border: '1px solid var(--glass-border)' 
          } 
        }} 
      />
      <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<DashboardLayout />}>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/employees" element={<EmployeeList />} />
        <Route path="/employees/new" element={<EmployeeWizard />} />
        <Route path="/employees/:id/profile" element={<EmployeeProfile />} />
        <Route path="/employees/:id/edit" element={<EmployeeWizard />} />
        <Route path="/employees/:id/documents" element={<DocumentUpload />} />
        <Route path="/my-profile" element={<MyProfile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </>
  );
};

export default App;
