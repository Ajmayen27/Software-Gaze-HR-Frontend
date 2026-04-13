import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { axiosInstance } from '../api/axiosInstance';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { motion } from 'framer-motion';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axiosInstance.post('/auth/register', formData);
      alert('Registration successful. Please login.');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel"
      style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
      <div style={{ textAlign: 'center' }}>
        <img src="/logo.png" alt="SoftwareGaze" style={{ height: '48px', marginBottom: '16px' }} />
        <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Create Admin Setup</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Register a root administrative account</p>
      </div>

      {error && (
        <div style={{ padding: '12px', background: 'rgba(229,72,77,0.1)', border: '1px solid var(--danger)', borderRadius: '8px', color: 'var(--danger)', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input 
          label="Full Name" 
          name="name"
          placeholder="Admin Name" 
          value={formData.name}
          onChange={handleChange}
          required
        />
        <Input 
          label="Email Address" 
          type="email" 
          name="email"
          placeholder="admin@company.com" 
          value={formData.email}
          onChange={handleChange}
          required
        />
        <Input 
          label="Password" 
          type="password" 
          name="password"
          placeholder="Min 8 characters" 
          value={formData.password}
          onChange={handleChange}
          required
        />

        <Button type="submit" loading={loading} style={{ marginTop: '8px' }}>
          Register Account
        </Button>
      </form>
      
      <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
        Already have an account? <Link to="/login" style={{ fontWeight: 500 }}>Sign In</Link>
      </div>
    </motion.div>
  );
};

export default Register;
