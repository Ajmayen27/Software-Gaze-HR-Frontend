import React, { useState } from 'react';
import { axiosInstance } from '../api/axiosInstance';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { UserPlus, User, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axiosInstance.post('/auth/register', form);
      alert('Admin account created! Please login.');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ width: '100%', maxWidth: '440px', padding: '0 20px' }}
    >
      <motion.div variants={itemVariants} style={{ marginBottom: '40px' }}>
        <span style={{ display: 'inline-block', padding: '4px 12px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '20px', fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '16px' }}>
          Admin Setup
        </span>
        <h1 style={{ fontSize: '32px', margin: '0 0 8px 0', fontWeight: '700', letterSpacing: '-0.5px' }}>Create an account</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '15px' }}>Initial setup for system administrators</p>
      </motion.div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--danger-light)', color: 'var(--danger)', fontSize: '14px', marginBottom: '24px', border: '1px solid rgba(220, 38, 38, 0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <AlertCircle size={16} />
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <motion.div variants={itemVariants}>
          <Input 
            label="Full Name" 
            icon={User}
            value={form.name} 
            onChange={(e) => setForm({ ...form, name: e.target.value })} 
            required 
            placeholder="John Doe" 
          />
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Input 
            label="Email Address" 
            type="email" 
            icon={Mail}
            value={form.email} 
            onChange={(e) => setForm({ ...form, email: e.target.value })} 
            required 
            placeholder="admin@company.com" 
          />
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Input 
            label="Password" 
            type="password" 
            icon={Lock}
            value={form.password} 
            onChange={(e) => setForm({ ...form, password: e.target.value })} 
            required 
            placeholder="Minimum 8 characters" 
          />
        </motion.div>

        <motion.div variants={itemVariants} style={{ marginTop: '8px' }}>
          <Button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: '15px', justifyContent: 'center' }} disabled={loading}>
            {loading ? <div className="spinner" /> : (
              <>Create Account <ArrowRight size={18} style={{ marginLeft: '4px' }} /></>
            )}
          </Button>
        </motion.div>
      </form>

      <motion.div variants={itemVariants} style={{ textAlign: 'center', marginTop: '32px', fontSize: '14px', color: 'var(--text-muted)' }}>
        Already have an account? <Link to="/login" style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>Sign in</Link>
      </motion.div>
    </motion.div>
  );
};

export default Register;
