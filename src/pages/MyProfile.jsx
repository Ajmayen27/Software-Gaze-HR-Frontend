import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../api/axiosInstance';
import { motion } from 'framer-motion';
import { User, Phone, Mail, MapPin, Building, Briefcase, FileText, Edit3, Image as ImageIcon, Lock, Save, X, UploadCloud, DownloadCloud } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { toast } from 'react-hot-toast';

const MyProfile = () => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    personalEmail: '',
    personalPhone: '',
    address: '',
    bankAccounts: []
  });

  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [images, setImages] = useState({
    profile_image: null,
    driving_license: null,
    pan_card: null,
    voter_id: null
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/my-profile');
      const empParams = res.data || res;
      setEmployee(empParams);
      
      setEditForm({
        personalEmail: empParams.personalEmail || '',
        personalPhone: empParams.personalPhone || '',
        address: empParams.address || '',
        bankAccounts: empParams.bankAccounts && empParams.bankAccounts.length > 0 ? empParams.bankAccounts : [{
            accountType: 'SAVINGS',
            accountHolderName: '',
            accountNumber: '',
            ifscCode: '',
            primary: true
        }]
      });
    } catch (err) {
      console.error('Failed to load your profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!employee) return;

    const docTypes = ['profile_image', 'driving_license', 'pan_card', 'voter_id'];
    
    docTypes.forEach(async (docType) => {
      try {
        const existingDoc = employee.documents?.find(d => d.documentType?.toLowerCase() === docType.toLowerCase());
        
        // Only attempt to fetch if the document actually exists in their profile
        if (!existingDoc) return;

        // ALWAYS use the employee-specific endpoint instead of the one in downloadUrl
        // because the one in downloadUrl might be the admin endpoint (e.g. /employees/3/documents/...)
        const endpoint = `/my-profile/documents/${docType.toUpperCase()}/download`;
        
        const docRes = await axiosInstance.get(endpoint, { responseType: 'blob' });
        
        if (docRes && docRes.size > 0) {
          const objectUrl = URL.createObjectURL(docRes);
          setImages(prev => ({ ...prev, [docType]: objectUrl }));
        }
      } catch (error) {
        // Ignore if document not found
      }
    });
    
    return () => {
      Object.values(images).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee]);

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const updateData = {
        ...employee,
        personalEmail: editForm.personalEmail,
        personalPhone: editForm.personalPhone,
        address: editForm.address,
        bankAccounts: editForm.bankAccounts
      };
      
      await axiosInstance.put(`/my-profile`, updateData);
      setIsEditing(false);
      fetchProfile();
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    try {
      await axiosInstance.patch('/my-profile/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      });
      toast.success('Password changed successfully!');
      setIsChangingPassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    }
  };

  const handleBankChange = (field, value) => {
    setEditForm(prev => {
      const newBankAccounts = [...prev.bankAccounts];
      if (newBankAccounts.length === 0) {
        newBankAccounts.push({ accountType: 'SAVINGS', primary: true });
      }
      newBankAccounts[0] = { ...newBankAccounts[0], [field]: value };
      return { ...prev, bankAccounts: newBankAccounts };
    });
  };

  const handleDocumentUpload = async (docType, e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      setUploadingDoc(true);
      const formData = new FormData();
      formData.append('file', file);
      
      await axiosInstance.post(`/my-profile/documents/${docType.toUpperCase()}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`${docType} uploaded successfully!`);
      fetchProfile();
    } catch (err) {
      toast.error(`Failed to upload ${docType}. ` + (err.message || ''));
    } finally {
      setUploadingDoc(false);
    }
  };

  if (loading && !employee) return <div className="spinner mx-auto mt-20"></div>;
  if (!employee) return <div className="text-center mt-20 text-[var(--text-muted)]">Could not load profile.</div>;

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
              </h1>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={16} /> {employee.designation?.title || employee.designation?.name || 'No Designation'} • {employee.department?.name || 'No Department'}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit3 size={16} /> Update Details
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => { setIsEditing(false); setEditForm({...employee}); }}>
                    <X size={16} /> Cancel
                  </Button>
                  <Button className="btn-primary" onClick={handleUpdateProfile} disabled={loading}>
                    <Save size={16} /> Save Changes
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1.5fr)', gap: '24px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
             <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><User size={18} /> Contact Information</h3>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                <DetailCard icon={Mail} title="Corporate Email" value={employee.workingEmail} />
                <DetailCard icon={Phone} title="Work Phone" value={employee.workingPhone} />
                
                {isEditing ? (
                  <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Input label="Personal Email" type="email" value={editForm.personalEmail} onChange={(e) => setEditForm({...editForm, personalEmail: e.target.value})} />
                    <Input label="Personal Phone" type="tel" value={editForm.personalPhone} onChange={(e) => setEditForm({...editForm, personalPhone: e.target.value})} />
                    <Input label="Residential Address" value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} />
                  </div>
                ) : (
                  <>
                    <DetailCard icon={Mail} title="Personal Email" value={employee.personalEmail} />
                    <DetailCard icon={Phone} title="Personal Phone" value={employee.personalPhone} />
                    <DetailCard icon={MapPin} title="Address" value={employee.address} />
                  </>
                )}
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
                  
                  {isEditing ? (
                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, margin: 0 }}>Update Bank Details</p>
                      <Input label="A/C Holder Name" value={editForm.bankAccounts[0]?.accountHolderName || ''} onChange={(e) => handleBankChange('accountHolderName', e.target.value)} />
                      <Input label="Account Number" value={editForm.bankAccounts[0]?.accountNumber || ''} onChange={(e) => handleBankChange('accountNumber', e.target.value)} />
                      <Input label="IFSC Code" value={editForm.bankAccounts[0]?.ifscCode || ''} onChange={(e) => handleBankChange('ifscCode', e.target.value)} />
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div>
             <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Building size={18} /> Corporate Details</h3>
             <div className="glass-panel" style={{ padding: '24px' }}>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                 <div>
                    <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Employee ID</label>
                    <div style={{ fontSize: '16px', fontWeight: 500, marginTop: '4px' }}>{employee.employeeId}</div>
                 </div>
                 <div>
                    <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Joining Date</label>
                    <div style={{ fontSize: '16px', fontWeight: 500, marginTop: '4px' }}>{employee.joiningDate}</div>
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
               </div>
             </div>
          </div>

          <div>
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Lock size={18} /> Account Security</h3>
            <div className="glass-panel" style={{ padding: '24px' }}>
              {!isChangingPassword ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontWeight: 500 }}>Password</p>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Update your account password</p>
                  </div>
                  <Button variant="ghost" onClick={() => setIsChangingPassword(true)}>Change Password</Button>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <Input type="password" label="Current Password" required value={passwordForm.currentPassword} onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})} />
                  <Input type="password" label="New Password" required value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} />
                  <Input type="password" label="Confirm New Password" required value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} />
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <Button type="button" variant="ghost" onClick={() => setIsChangingPassword(false)}>Cancel</Button>
                    <Button type="submit" className="btn-primary">Update Password</Button>
                  </div>
                </form>
              )}
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <ImageIcon size={18} /> Uploaded Documents
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
               {['profile_image', 'driving_license', 'pan_card', 'voter_id'].map((docType) => {
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
                     <span style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>{label}</span>
                     <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                       {images[docType] && (
                         <a href={images[docType]} download={`${docType}_${employee.name}`} style={{ textDecoration: 'none' }}>
                           <Button variant="ghost" style={{ padding: '4px 8px' }} title="Download"><DownloadCloud size={14} /></Button>
                         </a>
                       )}
                       <div>
                         <input type="file" id={`upload-${docType}`} style={{ display: 'none' }} onChange={(e) => handleDocumentUpload(docType, e)} disabled={uploadingDoc} accept="image/*,.pdf" />
                         <Button variant="ghost" style={{ padding: '4px 8px' }} onClick={() => document.getElementById(`upload-${docType}`).click()} title="Upload" disabled={uploadingDoc}>
                           <UploadCloud size={14} />
                         </Button>
                       </div>
                     </div>
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

export default MyProfile;
