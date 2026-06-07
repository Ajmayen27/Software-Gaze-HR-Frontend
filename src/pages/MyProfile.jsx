import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../api/axiosInstance';
import { motion } from 'framer-motion';
import { User, Phone, Mail, MapPin, Building, Briefcase, FileText, Edit3, Image as ImageIcon, Lock, Save, X, UploadCloud, DownloadCloud, DollarSign } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { toast } from 'react-hot-toast';
import { formatBDT } from '../utils/currency';

const MyProfile = () => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ personalEmail: '', personalPhone: '', address: '', bankAccounts: [] });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [images, setImages] = useState({ profile_image: null, driving_license: null, pan_card: null, voter_id: null });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/my-profile');
      const emp = res.data || res;
      setEmployee(emp);
      setEditForm({
        personalEmail: emp.personalEmail || '',
        personalPhone: emp.personalPhone || '',
        address: emp.address || '',
        gender: emp.gender || '',
        dateOfBirth: emp.dateOfBirth || '',
        married: emp.married || false,
        workingPhone: emp.workingPhone || '',
        bankAccounts: emp.bankAccounts?.length > 0 ? emp.bankAccounts : [{ accountType: 'SAVINGS', accountHolderName: '', accountNumber: '', ifscCode: '', primary: true }],
      });
    } catch {
      console.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  useEffect(() => {
    if (!employee) return;
    ['profile_image', 'driving_license', 'pan_card', 'voter_id'].forEach(async (docType) => {
      try {
        const existing = employee.documents?.find(d => d.documentType?.toLowerCase() === docType.toLowerCase());
        if (!existing) return;
        const endpoint = `/my-profile/documents/${docType.toUpperCase()}/download`;
        const docRes = await axiosInstance.get(endpoint, { responseType: 'blob' });
        if (docRes && docRes.size > 0) setImages(prev => ({ ...prev, [docType]: URL.createObjectURL(docRes) }));
      } catch { }
    });
    return () => { Object.values(images).forEach(url => { if (url) URL.revokeObjectURL(url); }); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee]);

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      await axiosInstance.put('/my-profile', editForm);
      setIsEditing(false);
      fetchProfile();
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.message || 'Update failed');
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error("Passwords don't match"); return; }
    try {
      await axiosInstance.patch('/my-profile/change-password', passwordForm);
      toast.success('Password changed!');
      setIsChangingPassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const handleBankChange = (field, value) => {
    setEditForm(prev => {
      const banks = [...prev.bankAccounts];
      if (!banks.length) banks.push({ accountType: 'SAVINGS', primary: true });
      banks[0] = { ...banks[0], [field]: value };
      return { ...prev, bankAccounts: banks };
    });
  };

  const handleDocumentUpload = async (docType, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingDoc(true);
      const formData = new FormData();
      formData.append('file', file);
      await axiosInstance.post(`/my-profile/documents/${docType.toUpperCase()}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`${docType.replace(/_/g, ' ')} uploaded!`);
      fetchProfile();
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingDoc(false);
    }
  };

  if (loading && !employee) return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>;
  if (!employee) return <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Could not load profile.</div>;

  const InfoRow = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 500 }}>{value || '—'}</span>
    </div>
  );

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'work', label: 'Work Info' },
    { key: 'documents', label: 'Documents' },
    { key: 'security', label: 'Security' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Profile Header */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ height: '100px', background: 'linear-gradient(135deg, #4F46E5, #0EA5E9)' }} />
        <div style={{ padding: '0 24px 24px 24px', display: 'flex', gap: '20px', marginTop: '-36px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid #fff', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, boxShadow: 'var(--shadow-md)' }}>
            {images.profile_image ? <img src={images.profile_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={32} color="var(--text-muted)" />}
          </div>
          <div style={{ paddingTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flex: 1 }}>
            <div>
              <h1 style={{ fontSize: '20px', margin: '0 0 4px' }}>{employee.name}</h1>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '13px' }}>
                {employee.designation?.name || '—'} • {employee.department?.name || '—'}
              </p>
            </div>
            {!isEditing ? (
              <Button className="btn-primary" onClick={() => setIsEditing(true)}><Edit3 size={14} /> Edit Profile</Button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="ghost" onClick={() => setIsEditing(false)}><X size={14} /> Cancel</Button>
                <Button className="btn-success" onClick={handleUpdateProfile}><Save size={14} /> Save</Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border-color)' }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px', fontSize: '13px', fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.key ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-family)', marginBottom: '-1px',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="card">
            <h3 style={{ fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={15} /> Contact</h3>
            <InfoRow label="Work Email" value={employee.workingEmail} />
            <InfoRow label="Work Phone" value={employee.workingPhone} />
            {isEditing ? (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Input label="Personal Email" type="email" value={editForm.personalEmail} onChange={e => setEditForm({ ...editForm, personalEmail: e.target.value })} />
                <Input label="Personal Phone" type="tel" value={editForm.personalPhone} onChange={e => setEditForm({ ...editForm, personalPhone: e.target.value })} />
                <Input label="Address" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} />
              </div>
            ) : (
              <>
                <InfoRow label="Personal Email" value={employee.personalEmail} />
                <InfoRow label="Personal Phone" value={employee.personalPhone} />
                <InfoRow label="Address" value={employee.address} />
              </>
            )}
          </div>
          <div className="card">
            <h3 style={{ fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><User size={15} /> Personal</h3>
            <InfoRow label="Employee ID" value={employee.employeeId} />
            <InfoRow label="Gender" value={employee.gender} />
            <InfoRow label="Date of Birth" value={employee.dateOfBirth} />
            <InfoRow label="Marital Status" value={employee.married ? 'Married' : 'Single'} />
            <div style={{ borderTop: '1px solid var(--border-light)', marginTop: '12px', paddingTop: '12px' }}>
              <h4 style={{ fontSize: '13px', marginBottom: '8px' }}>Bank Account</h4>
              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Input label="Holder Name" value={editForm.bankAccounts[0]?.accountHolderName || ''} onChange={e => handleBankChange('accountHolderName', e.target.value)} />
                  <Input label="Account No." value={editForm.bankAccounts[0]?.accountNumber || ''} onChange={e => handleBankChange('accountNumber', e.target.value)} />
                  <Input label="IFSC" value={editForm.bankAccounts[0]?.ifscCode || ''} onChange={e => handleBankChange('ifscCode', e.target.value)} />
                </div>
              ) : (
                <>
                  <InfoRow label="Holder" value={employee.bankAccounts?.[0]?.accountHolderName} />
                  <InfoRow label="Account No." value={employee.bankAccounts?.[0]?.accountNumber} />
                  <InfoRow label="IFSC" value={employee.bankAccounts?.[0]?.ifscCode} />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Work Info Tab */}
      {activeTab === 'work' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="card">
            <h3 style={{ fontSize: '14px', marginBottom: '12px' }}><Briefcase size={15} style={{ verticalAlign: 'text-bottom', marginRight: '6px' }} />Job Details</h3>
            <InfoRow label="Department" value={employee.department?.name} />
            <InfoRow label="Designation" value={employee.designation?.name} />
            <InfoRow label="Location" value={employee.location?.name} />
            <InfoRow label="Shift" value={employee.shift?.name} />
            <InfoRow label="Work Status" value={employee.employeeWorkStatus?.replace(/_/g, ' ')} />
            <InfoRow label="Joining Date" value={employee.joiningDate} />
          </div>
          <div className="card">
            <h3 style={{ fontSize: '14px', marginBottom: '12px' }}><DollarSign size={15} style={{ verticalAlign: 'text-bottom', marginRight: '6px' }} />Compensation</h3>
            <InfoRow label="Salary Group" value={employee.salaryGroup?.name} />
            <InfoRow label="Annual CTC" value={formatBDT(employee.annualCtc)} />
            <InfoRow label="Monthly Basic" value={formatBDT(employee.monthlyBasicSalary)} />
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
          {['profile_image', 'driving_license', 'pan_card', 'voter_id'].map(docType => {
            const label = docType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            return (
              <div key={docType} className="card card-compact" style={{ textAlign: 'center' }}>
                <div style={{ height: '80px', borderRadius: '8px', background: 'var(--bg-body)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                  {images[docType] ? <img src={images[docType]} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={28} color="var(--text-muted)" opacity={0.4} />}
                </div>
                <span style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>{label}</span>
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                  {images[docType] && (
                    <a href={images[docType]} download={`${docType}_${employee.name}`}>
                      <Button variant="ghost" style={{ padding: '4px 8px' }}><DownloadCloud size={12} /></Button>
                    </a>
                  )}
                  <input type="file" id={`upload-${docType}`} style={{ display: 'none' }} onChange={e => handleDocumentUpload(docType, e)} disabled={uploadingDoc} accept="image/*,.pdf" />
                  <Button variant="ghost" style={{ padding: '4px 8px' }} onClick={() => document.getElementById(`upload-${docType}`).click()} disabled={uploadingDoc}>
                    <UploadCloud size={12} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="card" style={{ maxWidth: '480px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}><Lock size={15} /> Change Password</h3>
          {!isChangingPassword ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 2px', fontWeight: 500, fontSize: '13px' }}>Password</p>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Update your account password</p>
              </div>
              <Button variant="ghost" onClick={() => setIsChangingPassword(true)}>Change</Button>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Input type="password" label="Current Password" required value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
              <Input type="password" label="New Password" required value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
              <Input type="password" label="Confirm Password" required value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <Button type="button" variant="ghost" onClick={() => setIsChangingPassword(false)}>Cancel</Button>
                <Button type="submit" className="btn-primary">Update</Button>
              </div>
            </form>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default MyProfile;
