import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Check, ShieldAlert, Search } from 'lucide-react';
import { axiosInstance } from '../../api/axiosInstance';
import { getSupportStaffList } from '../../api/support';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const RegisterSupportStaff = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [supportStaff, setSupportStaff] = useState([]);
  const [search, setSearch] = useState('');

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full Name is required';
    if (!form.email.trim()) e.email = 'Email Address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address format';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    return e;
  };

  const fetchSupportStaff = async () => {
    try {
      setStaffLoading(true);
      const res = await getSupportStaffList();
      const data = res?.data || res;
      setSupportStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load support staff:', err);
      setSupportStaff([]);
    } finally {
      setStaffLoading(false);
    }
  };

  useEffect(() => {
    fetchSupportStaff();
  }, []);

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
      await fetchSupportStaff();
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

  const filteredStaff = supportStaff.filter((staff) => {
    const term = search.toLowerCase();
    return !term || `${staff?.name || ''} ${staff?.email || ''}`.toLowerCase().includes(term);
  });

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <span style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary-light)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus size={22} color="var(--primary)" />
            </span>
            Support Staff
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '6px 0 0' }}>Manage support staff accounts and register new agents from one place.</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => navigate('/support/dashboard')}>
          Back to Support Dashboard
        </Button>
      </div>

      {success && (
        <div style={{ padding: '14px 18px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#16a34a', fontSize: '14px', marginBottom: '20px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Check size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
          <span style={{ fontWeight: 500 }}>{success}</span>
        </div>
      )}

      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '1.15fr 0.85fr' }}>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ margin: 0, fontSize: '18px' }}>Registered Support Staff</h2>
            <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>A complete view of active support agents.</p>
          </div>

          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              style={{ width: '100%', padding: '10px 12px 10px 38px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-body)', color: 'var(--text-primary)' }}
            />
          </div>

          {staffLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading support staff...</div>
          ) : filteredStaff.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
              No support staff found.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredStaff.map((staff, idx) => (
                <div key={staff?.id || idx} style={{ padding: '14px 16px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-body)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{staff?.name || 'Unnamed Staff'}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{staff?.email || 'No email'}</div>
                    </div>
                    <span className="badge badge-info" style={{ fontSize: '10px' }}>Support Staff</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ margin: '0 0 8px', fontSize: '18px' }}>Register New Support Staff</h2>
          <p style={{ margin: '0 0 20px', color: 'var(--text-muted)', fontSize: '13px' }}>Create a support account and grant access to tickets and client workflows.</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <Button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <div className="spinner" style={{ width: '16px', height: '16px' }} /> : <><Check size={16} /> Register Staff</>}
              </Button>
            </div>
          </form>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <ShieldAlert size={18} color="var(--warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Once registered, the agent can sign in directly and access support dashboard, tickets, and client workflows.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterSupportStaff;
