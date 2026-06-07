import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Check, ArrowLeft, ShieldAlert } from 'lucide-react';
import { axiosInstance } from '../../api/axiosInstance';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const RegisterSupportStaff = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full Name is required';
    if (!form.email.trim()) e.email = 'Email Address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address format';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setSuccess('');
    try {
      await axiosInstance.post('/auth/support-staff/register', form);
      toast.success('Support Staff registered successfully!');
      setSuccess(`Support staff agent "${form.name}" has been registered successfully!`);
      setForm({ name: '', email: '', password: '' });
    } catch (err) {
      toast.error(err?.message || err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (success) setSuccess('');
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '12px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-light)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserPlus size={20} color="var(--primary)" />
          </span>
          Create Support Staff
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: '4px 0 0' }}>Register a new support staff account. Only system administrators can perform this action.</p>
      </div>

      {success && (
        <div style={{ padding: '14px 18px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#16a34a', fontSize: '14px', marginBottom: '20px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Check size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
          <span style={{ fontWeight: 500 }}>{success}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="card" style={{ padding: '32px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Input
            label="Full Name *"
            name="name"
            icon={User}
            value={form.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="e.g. John Doe"
            required
          />

          <Input
            label="Email Address *"
            name="email"
            type="email"
            icon={Mail}
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="support.agent@company.com"
            required
          />

          <Input
            label="Password *"
            name="password"
            type="password"
            icon={Lock}
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="Minimum 6 characters"
            required
          />

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
            <Button type="button" variant="secondary" onClick={() => navigate('/support/dashboard')}>
              Cancel
            </Button>
            <Button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <div className="spinner" style={{ width: '16px', height: '16px' }} /> : <><Check size={16} /> Register Staff</>}
            </Button>
          </div>
        </form>
      </div>

      {/* Info notice */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px', padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
        <ShieldAlert size={18} color="var(--warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Once registered, this support agent can log in directly using their email and password. They will have access to the Support Dashboard, Client List, and Support Tickets.
        </p>
      </div>
    </div>
  );
};

export default RegisterSupportStaff;
