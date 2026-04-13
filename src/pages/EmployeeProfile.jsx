import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { axiosInstance } from '../api/axiosInstance';
import { motion } from 'framer-motion';
import { User, Phone, Mail, MapPin, Building, Briefcase, Calendar, FileText, ArrowLeft, Edit3, Image as ImageIcon } from 'lucide-react';
import Button from '../components/ui/Button';

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Track dynamically fetched blobs for each document type
  const [images, setImages] = useState({
    profile_image: null,
    driving_license: null,
    pan_card: null,
    voter_id: null
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/employees/${id}`);
        const empParams = res.data || res;
        setEmployee(empParams);
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
        // Find if document exists in employee object securely using downloadUrl or fallback to expected route
        let endpoint = `/employees/${employee.id}/documents/${docType.toUpperCase()}/download`;
        const existingDoc = employee.documents?.find(d => d.documentType.toLowerCase() === docType.toLowerCase());
        
        if (existingDoc && existingDoc.downloadUrl) {
          // If the backend returns an absolute path containing /api/v1, we must strip it so it doesn't duplicate
          endpoint = existingDoc.downloadUrl.startsWith('/api/v1') 
            ? existingDoc.downloadUrl.substring(7) 
            : existingDoc.downloadUrl;
        }
        
        // Fetch as blob to attach authorization token seamlessly 
        const docRes = await axiosInstance.get(endpoint, { responseType: 'blob' });
        
        if (docRes && docRes.size > 0) { // Checking for valid blob
          const objectUrl = URL.createObjectURL(docRes);
          setImages(prev => ({ ...prev, [docType]: objectUrl }));
        }
      } catch (error) {
        // Document missing or error fetching, ignore gracefully
      }
    });
    
    // Cleanup URLs on unmount
    return () => {
      Object.values(images).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee]);

  if (loading) return <div className="spinner mx-auto mt-20"></div>;
  if (!employee) return <div className="text-center mt-20 text-[var(--text-muted)]">Employee not found.</div>;

  const DetailCard = ({ icon: Icon, title, value }) => (
    <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(110,86,207,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
        <Icon size={24} />
      </div>
      <div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontWeight: 500, fontSize: '15px' }}>{value || '—'}</div>
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header Profile Section */}
      <div className="glass-panel" style={{ position: 'relative', overflow: 'hidden', padding: 0 }}>
        <div style={{ height: '120px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', opacity: 0.8 }} />
        <div style={{ padding: '0 32px 32px 32px', display: 'flex', gap: '24px', position: 'relative', marginTop: '-48px' }}>
          
          <div style={{ flexShrink: 0, width: '128px', height: '128px', borderRadius: '50%', border: '4px solid var(--bg-main)', background: 'var(--input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', zIndex: 2 }}>
            {images.profile_image ? (
              <img src={images.profile_image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={48} color="var(--text-muted)" />
            )}
          </div>

          <div style={{ paddingTop: '56px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flex: 1 }}>
            <div>
              <h1 style={{ fontSize: '28px', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                {employee.name}
                <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '20px', background: employee.status === 'ACTIVE' ? 'rgba(48,164,108,0.15)' : 'rgba(229,72,77,0.15)', color: employee.status === 'ACTIVE' ? 'var(--success)' : 'var(--danger)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', verticalAlign: 'middle' }}>
                  {employee.status}
                </span>
              </h1>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={16} /> {employee.designation?.title || employee.designation?.name || 'No Designation'} • {employee.department?.name || 'No Department'}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button variant="ghost" onClick={() => navigate('/employees')}>
                <ArrowLeft size={16} /> Directory
              </Button>
              <Button onClick={() => navigate(`/employees/${employee.id}/edit`)}>
                <Edit3 size={16} /> Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1.5fr)', gap: '24px' }}>
        
        {/* Left Column: Personal & Contact */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
             <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><User size={18} /> Personal Information</h3>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                <DetailCard icon={MapPin} title="Employee ID" value={employee.employeeId} />
                <DetailCard icon={Mail} title="Corporate Email" value={employee.workingEmail} />
                <DetailCard icon={Phone} title="Work Phone" value={employee.workingPhone} />
                <DetailCard icon={Calendar} title="Joining Date" value={employee.joiningDate} />
             </div>
          </div>
          
          <div>
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={18} /> Identification & Bank</h3>
            <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>PAN Number</label>
                    <div style={{ fontWeight: 500 }}>{employee.panNumber || '—'}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Voter ID</label>
                    <div style={{ fontWeight: 500 }}>{employee.voterIdNumber || '—'}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1', height: '1px', background: 'var(--glass-border)', margin: '8px 0' }} />
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>A/C Holder Name</label>
                    <div style={{ fontWeight: 500 }}>{employee.bankAccounts?.[0]?.accountHolderName || '—'}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>A/C Number</label>
                    <div style={{ fontWeight: 500 }}>{employee.bankAccounts?.[0]?.accountNumber || '—'}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>IFSC</label>
                    <div style={{ fontWeight: 500 }}>{employee.bankAccounts?.[0]?.ifscCode || '—'}</div>
                  </div>
                </div>
            </div>
          </div>
        </div>

        {/* Right Column: Corporate Setup & Documents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div>
             <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Building size={18} /> Corporate Hierarchy</h3>
             <div className="glass-panel" style={{ padding: '24px' }}>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                 <div>
                    <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Managing Authority (Reports To)</label>
                    <div style={{ fontSize: '16px', fontWeight: 500, marginTop: '4px' }}>{employee.reportTo?.name || 'Highest Level (N/A)'}</div>
                 </div>
                 <div>
                    <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Work Location</label>
                    <div style={{ fontSize: '16px', fontWeight: 500, marginTop: '4px' }}>{employee.location?.name || 'Not Assigned'}</div>
                 </div>
                 <div>
                    <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Shift Timings</label>
                    <div style={{ fontSize: '16px', fontWeight: 500, marginTop: '4px' }}>{employee.shift?.name || 'Standard'}</div>
                 </div>
                 <div>
                    <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Employment Type</label>
                    <div style={{ fontSize: '16px', fontWeight: 500, marginTop: '4px' }}>{employee.employeeWorkStatus?.replace('_', ' ') || 'FULL TIME'}</div>
                 </div>
                 <div>
                    <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>CTC (Annual)</label>
                    <div style={{ fontSize: '16px', fontWeight: 500, marginTop: '4px', color: 'var(--success)' }}>
                      {employee.annualCtc ? `$${employee.annualCtc.toLocaleString()}` : '—'}
                    </div>
                 </div>
               </div>
             </div>
          </div>

          <div>
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
               <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ImageIcon size={18} /> Verified Documents</span>
               <Button variant="ghost" onClick={() => navigate(`/employees/${employee.id}/documents`)}>Manage Documents</Button>
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
               {['driving_license', 'pan_card', 'voter_id'].map((docType) => {
                 const label = docType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                 return (
                   <div key={docType} className="glass-panel" style={{ padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                     <div style={{ width: '100%', height: '90px', borderRadius: '8px', background: 'var(--bg-main)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', border: '1px solid var(--glass-border)' }}>
                       {images[docType] ? (
                         <img src={images[docType]} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                       ) : (
                         <ImageIcon size={32} color="var(--text-muted)" opacity={0.5} />
                       )}
                     </div>
                     <span style={{ fontSize: '13px', fontWeight: 500 }}>{label}</span>
                     <span style={{ fontSize: '11px', color: images[docType] ? 'var(--success)' : 'var(--text-muted)' }}>
                       {images[docType] ? 'Verified' : 'Pending'}
                     </span>
                   </div>
                 );
               })}
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default EmployeeProfile;
