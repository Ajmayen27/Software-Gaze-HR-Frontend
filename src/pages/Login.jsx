import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { motion } from 'framer-motion';

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
       setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel"
      style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
      <div style={{ textAlign: 'center' }}>
        <img src="/logo.png" alt="SoftwareGaze" style={{ height: '48px', marginBottom: '16px' }} />
        <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Welcome Back</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Sign in to continue to SoftwareGaze HR</p>
      </div>

      {error && (
        <div style={{ padding: '12px', background: 'rgba(229,72,77,0.1)', border: '1px solid var(--danger)', borderRadius: '8px', color: 'var(--danger)', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input 
          label="Email Address" 
          type="email" 
          autoComplete="email"
          placeholder="name@company.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input 
          label="Password" 
          type="password" 
          autoComplete="current-password"
          placeholder="••••••••" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <a href="#" style={{ fontSize: '13px' }}>Forgot password?</a>
        </div>

        <Button type="submit" loading={loading} style={{ marginTop: '8px' }}>
          Sign In
        </Button>
      </form>
      <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
        Do not have an admin account? <Link to="/register" style={{ fontWeight: 500 }}>Register</Link>
      </div>
    </motion.div>
  );
};

export default Login;
