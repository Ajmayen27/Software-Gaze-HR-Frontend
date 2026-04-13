import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { axiosInstance } from '../api/axiosInstance';
import Button from '../components/ui/Button';
import { UploadCloud, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const allowedTypes = ['profile_image', 'driving_license', 'pan_card', 'voter_id'];

const DocumentUpload = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState({});
  const [uploading, setUploading] = useState(false);
  const [statuses, setStatuses] = useState({}); // tracking { [docType]: 'success' | 'error' }

  const handleFileChange = (docType, e) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [docType]: e.target.files[0] }));
    }
  };

  const uploadFile = async (docType) => {
    const file = files[docType];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      await axiosInstance.post(`/employees/${id}/documents/${docType.toUpperCase()}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setStatuses(prev => ({ ...prev, [docType]: 'success' }));
    } catch (error) {
      alert(`Failed to upload ${docType}. ${error.message}`);
      setStatuses(prev => ({ ...prev, [docType]: 'error' }));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', margin: '0 0 8px 0' }}>Upload Documents</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Attach required KYC and ID files for Employee #{id}</p>
      </div>

      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {allowedTypes.map((type) => {
           const label = type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
           const status = statuses[type];

           return (
             <div key={type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--glass-border)', borderRadius: '8px', background: 'var(--input-bg)' }}>
               <div>
                 <h4 style={{ margin: '0 0 4px 0' }}>{label}</h4>
                 <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Max size: 10MB (PDF/JPG/PNG)</p>
               </div>
               
               <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                 {status === 'success' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
                      <CheckCircle size={20} />
                      <span style={{ fontSize: '14px', fontWeight: 500 }}>Uploaded</span>
                    </div>
                 ) : (
                   <>
                     <input 
                       type="file" 
                       id={`fileUpload-${type}`} 
                       style={{ display: 'none' }} 
                       onChange={(e) => handleFileChange(type, e)}
                       accept="image/*,.pdf"
                     />
                     <label htmlFor={`fileUpload-${type}`} className="btn btn-ghost" style={{ padding: '8px 12px' }}>
                       {files[type] ? files[type].name : 'Choose File'}
                     </label>
                     <Button 
                       disabled={!files[type] || uploading} 
                       onClick={() => uploadFile(type)}
                       style={{ padding: '8px 16px' }}
                     >
                       <UploadCloud size={16} /> Upload
                     </Button>
                   </>
                 )}
               </div>
             </div>
           );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
        <Button variant="primary" onClick={() => navigate('/employees')}>Complete & Return to Directory</Button>
      </div>
    </div>
  );
};

export default DocumentUpload;
