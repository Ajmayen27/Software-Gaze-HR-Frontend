import React, { useEffect, useState } from 'react';
import {
  Building2, User, Mail, Phone, MapPin, Edit2, Check,
  X, Lock, Eye, EyeOff, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getMyClientProfile, updateMyClientProfile } from '../../api/clients';
import { axiosInstance } from '../../api/axiosInstance';

// ── Info Row ──────────────────────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={15} color="var(--primary)" />
    </div>
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{value || <span style={{ color: 'var(--text-muted)' }}>—</span>}</div>
    </div>
  </div>
);

// ── Edit Profile Modal ────────────────────────────────────────────────────────
const EditProfileModal = ({ profile, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: profile?.name || '',
    companyName: profile?.companyName || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    contactEmail: profile?.contactEmail || '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await updateMyClientProfile(form);
      toast.success('Profile updated successfully');
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const Field = ({ label, name, type = 'text', required }) => (
    <div className="input-group">
      <label className="input-label">{label}{required && <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>}</label>
      <input
        className={`input-field ${errors[name] ? 'input-error' : ''}`}
        type={type}
        value={form[name]}
        onChange={e => { setForm(f => ({ ...f, [name]: e.target.value })); setErrors(p => ({ ...p, [name]: '' })); }}
      />
      {errors[name] && <span className="input-error-msg">{errors[name]}</span>}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, margin: 0 }}>Edit My Profile</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Full Name" name="name" required />
            <Field label="Company Name" name="companyName" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Contact Email" name="contactEmail" type="email" />
            <Field label="Phone" name="phone" />
          </div>
          <Field label="Address" name="address" />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : <><Check size={15} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Change Password Modal ─────────────────────────────────────────────────────
const ChangePasswordModal = ({ onClose }) => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.currentPassword) e.currentPassword = 'Current password is required';
    if (!form.newPassword || form.newPassword.length < 8) e.newPassword = 'New password must be at least 8 characters';
    if (form.newPassword !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await axiosInstance.patch('/my-profile/change-password', form);
      toast.success('Password changed successfully');
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to change password');
    } finally { setSaving(false); }
  };

  const PwField = ({ label, name, showKey }) => (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          className={`input-field ${errors[name] ? 'input-error' : ''}`}
          type={showPw[showKey] ? 'text' : 'password'}
          value={form[name]}
          onChange={e => { setForm(f => ({ ...f, [name]: e.target.value })); setErrors(p => ({ ...p, [name]: '' })); }}
          style={{ paddingRight: 38 }}
        />
        <button type="button" onClick={() => setShowPw(p => ({ ...p, [showKey]: !p[showKey] }))}
          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          {showPw[showKey] ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {errors[name] && <span className="input-error-msg">{errors[name]}</span>}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, margin: 0 }}>Change Password</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <PwField label="Current Password" name="currentPassword" showKey="current" />
          <PwField label="New Password" name="newPassword" showKey="new" />
          <PwField label="Confirm New Password" name="confirmPassword" showKey="confirm" />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : <><Shield size={15} /> Update Password</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const ClientProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'edit' | 'password'

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await getMyClientProfile();
      setProfile(res?.data || res);
    } catch {
      toast.error('Failed to load your profile');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchProfile(); }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  if (!profile) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <p style={{ color: 'var(--text-muted)' }}>Could not load profile.</p>
    </div>
  );

  const initials = profile.name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'C';

  return (
    <div className="animate-fade-in" style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
        borderRadius: '16px 16px 0 0',
        padding: '32px 28px 60px',
        color: '#fff',
        position: 'relative'
      }}>
        <h1 style={{ margin: 0, fontSize: 20, color: '#fff', fontWeight: 700 }}>My Profile</h1>
        <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: 13 }}>Manage your account information</p>
      </div>

      {/* Avatar + Actions */}
      <div style={{ background: 'var(--bg-card)', borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '0 28px 20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          border: '4px solid var(--bg-card)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 28, fontWeight: 700,
          marginTop: -40, boxShadow: 'var(--shadow-md)'
        }}>
          {initials}
        </div>
        <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal('password')}>
            <Lock size={14} /> Change Password
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setModal('edit')}>
            <Edit2 size={14} /> Edit Profile
          </button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="card" style={{ borderRadius: '0 0 16px 16px', borderTop: 'none' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
          <h2 style={{ fontSize: 20, margin: 0 }}>{profile.name}</h2>
          <span className={`badge ${profile.active ? 'badge-success' : 'badge-danger'}`}>
            {profile.active ? 'Active' : 'Inactive'}
          </span>
        </div>
        {profile.clientId && (
          <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 10px', borderRadius: 6, display: 'inline-block', marginBottom: 20 }}>
            {profile.clientId}
          </span>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
          <InfoRow icon={User} label="Full Name" value={profile.name} />
          <InfoRow icon={Building2} label="Company" value={profile.companyName} />
          <InfoRow icon={Mail} label="Contact Email" value={profile.contactEmail} />
          <InfoRow icon={Phone} label="Phone" value={profile.phone} />
          <InfoRow icon={MapPin} label="Address" value={profile.address} />
        </div>

        <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--bg-body)', borderRadius: 10, fontSize: 12, color: 'var(--text-muted)' }}>
          Account created: {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
        </div>
      </div>

      {modal === 'edit' && (
        <EditProfileModal profile={profile} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchProfile(); }} />
      )}
      {modal === 'password' && (
        <ChangePasswordModal onClose={() => setModal(null)} />
      )}
    </div>
  );
};

export default ClientProfile;
