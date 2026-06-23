import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '../assets/Logo_SG-removebg-preview.png';

const AuthLayout = () => {
  const { isAuthenticated, loading, role } = useAuth();

  if (loading) return null;
  if (isAuthenticated) {
    const roleUpper = typeof role === 'string' ? role.toUpperCase() : '';
    if (roleUpper.includes('SUPPORT'))  return <Navigate to="/support/tickets" replace />;
    if (roleUpper.includes('EMPLOYEE')) return <Navigate to="/my-profile" replace />;
    if (roleUpper.includes('CLIENT'))   return <Navigate to="/support-tickets" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="auth-layout-container">
      {/* Absolute Professional Logo placement at Top Left */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ position: 'absolute', top: '30px', left: '40px', zIndex: 50 }}
      >
        <img src={logo} alt="SoftwareGaze Logo" style={{ height: '40px', objectFit: 'contain' }} />
      </motion.div>

      <div className="auth-form-side">
        <Outlet />
      </div>

      <div className="auth-visual-side">
        {/* Animated Background Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: 'absolute',
            top: '-10%',
            left: '-10%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)',
            borderRadius: '50%',
          }}
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          style={{
            position: 'absolute',
            bottom: '-15%',
            right: '-10%',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)',
            borderRadius: '50%',
          }}
        />

        <div className="visual-content">
          <motion.div
            className="visual-icon-wrapper"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{ position: 'relative', zIndex: 10 }}
          >
            <Briefcase size={36} color="#fff" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ position: 'relative', zIndex: 10 }}
          >
            <h2>Elevate Your HR Experience.</h2>
            <p>Streamline operations, manage payroll, and support your team—all in one unified, intelligent platform.</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
