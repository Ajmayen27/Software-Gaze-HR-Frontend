import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { LogIn, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
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

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
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
          Welcome Back
        </span>
        <h1 style={{ fontSize: '32px', margin: '0 0 8px 0', fontWeight: '700', letterSpacing: '-0.5px' }}>Sign in to your account</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '15px' }}>Access the HR management portal</p>
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
            label="Email Address" 
            type="email" 
            icon={Mail}
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            placeholder="you@company.com" 
          />
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Input 
            label="Password" 
            type="password" 
            icon={Lock}
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            placeholder="••••••••" 
          />
        </motion.div>

        <motion.div variants={itemVariants} style={{ marginTop: '8px' }}>
          <Button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: '15px', justifyContent: 'center' }} disabled={loading}>
            {loading ? <div className="spinner" /> : (
              <>Sign In <ArrowRight size={18} style={{ marginLeft: '4px' }} /></>
            )}
          </Button>
        </motion.div>
      </form>

      <motion.div variants={itemVariants} style={{ textAlign: 'center', marginTop: '28px', fontSize: '14px', color: 'var(--text-muted)' }}>
        Don't have an account yet? <Link to="/register" style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>Register now</Link>
      </motion.div>
    </motion.div>
  );
};

export default Login;
