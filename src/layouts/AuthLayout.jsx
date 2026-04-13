import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/employees" replace />;

  return (
    <div className="auth-layout" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Full-screen Background Image */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'url(/auth-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}></div>
      {/* Soft overlay for text readability */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1,
        background: 'linear-gradient(135deg, rgba(9,9,11,0.45) 0%, rgba(13,12,20,0.40) 50%, rgba(9,9,11,0.50) 100%)',
      }}></div>
      {/* Ambient Glow Effects */}
      <div style={{
        position: 'fixed', top: '-15%', left: '-10%', width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(110,86,207,0.35) 0%, rgba(0,0,0,0) 70%)', zIndex: 2
      }}></div>
      <div style={{
        position: 'fixed', bottom: '-15%', right: '-10%', width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(233,61,130,0.25) 0%, rgba(0,0,0,0) 70%)', zIndex: 2
      }}></div>
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 3, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
