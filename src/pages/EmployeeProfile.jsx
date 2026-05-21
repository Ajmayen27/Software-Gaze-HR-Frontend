import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { axiosInstance } from '../api/axiosInstance';
import { motion } from 'framer-motion';
import { User, Phone, Mail, MapPin, Building, Briefcase, Calendar, FileText, ArrowLeft, Edit3, Image as ImageIcon, DollarSign } from 'lucide-react';
import Button from '../components/ui/Button';
import { formatBDT } from '../utils/currency';

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [images, setImages] = useState({ profile_image: null, driving_license: null, pan_card: null, voter_id: null });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/employees/${id}`);
        setEmployee(res.data || res);
      } catch (err) {
        console.error('Failed to load employee profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  useEffect(() => {
    if (!employee) return;
    const docTypes = ['profile_image', 'driving_license', 'pan_card', 'voter_id'];
    docTypes.forEach(async (docType) => {
      try {
        let endpoint = `/employees/${employee.id}/documents/${docType.toUpperCase()}/download`;
        const existingDoc = employee.documents?.find(d => d.documentType.toLowerCase() === docType.toLowerCase());
        if (existingDoc && existingDoc.downloadUrl) {
          endpoint = existingDoc.downloadUrl.startsWith('/api/v1')
            ? existingDoc.downloadUrl.substring(7)
            : existingDoc.downloadUrl;
        }
        const docRes = await axiosInstance.get(endpoint, { responseType: 'blob' });
        if (docRes && docRes.size > 0) {
          setImages(prev => ({ ...prev, [docType]: URL.createObjectURL(docRes) }));
        }
      } catch { }
    });
    return () => { Object.values(images).forEach(url => { if (url) URL.revokeObjectURL(url); }); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>;
  if (!employee) return <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Employee not found.</div>;

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'job', label: 'Job Details' },
    { key: 'salary', label: 'Salary' },
    { key: 'bank', label: 'Bank Accounts' },
    { key: 'documents', label: 'Documents' },
  ];

  const InfoRow = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 500 }}>{value || '—'}</span>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ height: '100px', background: 'linear-gradient(135deg, #4F46E5, #0EA5E9)' }} />
        <div style={{ padding: '0 24px 24px 24px', display: 'flex', gap: '20px', marginTop: '-36px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid #fff', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, boxShadow: 'var(--shadow-md)' }}>
            {images.profile_image ? <img src={images.profile_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={32} color="var(--text-muted)" />}
          </div>
          <div style={{ paddingTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flex: 1 }}>
            <div>
              <h1 style={{ fontSize: '20px', margin: '0 0 4px' }}>
                {employee.name}
                <span className={`badge ${employee.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`} style={{ marginLeft: '10px', verticalAlign: 'middle' }}>{employee.status}</span>
              </h1>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '13px' }}>
                {employee.designation?.name || '—'} • {employee.department?.name || '—'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="ghost" onClick={() => navigate('/employees')}><ArrowLeft size={14} /> Back</Button>
              <Button className="btn-primary" onClick={() => navigate(`/employees/${employee.id}/edit`)}><Edit3 size={14} /> Edit</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0' }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px', fontSize: '13px', fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.key ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-family)',
              marginBottom: '-1px',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="card">
            <h3 style={{ fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><User size={15} /> Personal</h3>
            <InfoRow label="Employee ID" value={employee.employeeId} />
            <InfoRow label="Gender" value={employee.gender} />
            <InfoRow label="Date of Birth" value={employee.dateOfBirth} />
            <InfoRow label="Marital Status" value={employee.married ? 'Married' : 'Single'} />
            <InfoRow label="Address" value={employee.address} />
          </div>
          <div className="card">
            <h3 style={{ fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={15} /> Contact</h3>
            <InfoRow label="Work Email" value={employee.workingEmail} />
            <InfoRow label="Work Phone" value={employee.workingPhone} />
            <InfoRow label="Personal Email" value={employee.personalEmail} />
            <InfoRow label="Personal Phone" value={employee.personalPhone} />
          </div>
        </div>
      )}

      {activeTab === 'job' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="card">
            <h3 style={{ fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Briefcase size={15} /> Job Details</h3>
            <InfoRow label="Department" value={employee.department?.name} />
            <InfoRow label="Designation" value={employee.designation?.name} />
            <InfoRow label="Location" value={employee.location?.name} />
            <InfoRow label="Shift" value={employee.shift?.name} />
            <InfoRow label="Reports To" value={employee.reportTo?.name} />
            <InfoRow label="Is Manager" value={employee.manager ? 'Yes' : 'No'} />
          </div>
          <div className="card">
            <h3 style={{ fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={15} /> Dates & Status</h3>
            <InfoRow label="Work Status" value={employee.employeeWorkStatus?.replace(/_/g, ' ')} />
            <InfoRow label="Joining Date" value={employee.joiningDate} />
            <InfoRow label="Probation Start" value={employee.probationStartDate} />
            <InfoRow label="Probation End" value={employee.probationEndDate} />
            <InfoRow label="Notice Start" value={employee.noticeStartDate} />
            <InfoRow label="Notice End" value={employee.noticeEndDate} />
            <InfoRow label="End Date" value={employee.endDate} />
          </div>
        </div>
      )}

      {activeTab === 'salary' && (
        <div className="card">
          <h3 style={{ fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}><DollarSign size={15} /> Compensation</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Salary Group', value: employee.salaryGroup?.name || '—' },
              { label: 'Annual CTC', value: formatBDT(employee.annualCtc), color: 'var(--primary)' },
              { label: 'Annual Basic', value: formatBDT(employee.annualBasicSalary), color: 'var(--info)' },
              { label: 'Monthly Basic', value: formatBDT(employee.monthlyBasicSalary), color: 'var(--success)' },
            ].map(s => (
              <div key={s.label} className="card card-compact" style={{ textAlign: 'center', background: 'var(--bg-body)' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: s.color || 'var(--text-primary)', fontFamily: 'monospace' }}>{s.value}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'bank' && (
        <div className="card">
          <h3 style={{ fontSize: '14px', marginBottom: '16px' }}>Bank Accounts</h3>
          {employee.bankAccounts?.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr><th>Type</th><th>Holder Name</th><th>Account No.</th><th>IFSC</th><th>Primary</th></tr>
              </thead>
              <tbody>
                {employee.bankAccounts.map(b => (
                  <tr key={b.id}>
                    <td>{b.accountType}</td><td>{b.accountHolderName}</td><td>{b.accountNumber}</td><td>{b.ifscCode}</td>
                    <td>{b.primary ? <span className="badge badge-success">Primary</span> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p style={{ color: 'var(--text-muted)' }}>No bank accounts linked.</p>}
        </div>
      )}

      {activeTab === 'documents' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
          {['profile_image', 'driving_license', 'pan_card', 'voter_id'].map(docType => {
            const label = docType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            return (
              <div key={docType} className="card card-compact" style={{ textAlign: 'center' }}>
                <div style={{ height: '80px', borderRadius: '8px', background: 'var(--bg-body)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                  {images[docType] ? <img src={images[docType]} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={28} color="var(--text-muted)" opacity={0.4} />}
                </div>
                <span style={{ fontSize: '12px', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: '10px', color: images[docType] ? 'var(--success)' : 'var(--text-muted)' }}>{images[docType] ? 'Uploaded' : 'Not available'}</span>
              </div>
            );
          })}
          <div className="card card-compact" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => navigate(`/employees/${employee.id}/documents`)}>
            <Button variant="ghost" style={{ fontSize: '12px' }}>Manage Documents</Button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default EmployeeProfile;
