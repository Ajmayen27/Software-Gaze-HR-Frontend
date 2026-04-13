import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LookupService } from '../../api/lookups';
import { axiosInstance } from '../../api/axiosInstance';
import { useParams, useNavigate } from 'react-router-dom';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const tabs = ['Basic Info', 'Personal', 'Company', 'Timeline', 'Salary', 'Bank'];

const EmployeeWizard = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lookups, setLookups] = useState(null);
  const [designations, setDesignations] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '', employeeId: '', workingEmail: '', workingPhone: '', joiningDate: '', status: 'ACTIVE', address: '', allowLogin: false, password: '',
    gender: 'MALE', dateOfBirth: '', personalEmail: '', personalPhone: '', married: false,
    locationId: '', shiftId: '', departmentId: '', designationId: '', reportToId: '', manager: false,
    probationStartDate: '', probationEndDate: '', noticeStartDate: '', noticeEndDate: '', endDate: '', employeeWorkStatus: 'FULL_TIME',
    salaryGroupId: '', annualCtc: '',
    drivingLicenseNumber: '', panNumber: '', voterIdNumber: '', accountType: 'SAVINGS', accountHolderName: '', accountNumber: '', ifscCode: ''
  });

  const [nextEmployeeId, setNextEmployeeId] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const refs = await LookupService.fetchAllLookups();
        setLookups(refs);

        if (isEdit) {
           const res = await axiosInstance.get(`/employees/${id}`);
           const emp = res.data || res;
           
           setFormData({
             name: emp.name || '',
             employeeId: emp.employeeId || '',
             workingEmail: emp.workingEmail || '',
             workingPhone: emp.workingPhone || '',
             joiningDate: emp.joiningDate || '',
             status: emp.status || 'ACTIVE',
             address: emp.address || '',
             allowLogin: emp.allowLogin || false,
             password: '',
             gender: emp.gender || 'MALE',
             dateOfBirth: emp.dateOfBirth || '',
             personalEmail: emp.personalEmail || '',
             personalPhone: emp.personalPhone || '',
             married: emp.married || false,
             locationId: emp.location?.id || '',
             shiftId: emp.shift?.id || '',
             departmentId: emp.department?.id || '',
             designationId: emp.designation?.id || '',
             reportToId: emp.reportTo?.id || '',
             manager: emp.manager || false,
             probationStartDate: emp.probationStartDate || '',
             probationEndDate: emp.probationEndDate || '',
             employeeWorkStatus: emp.employeeWorkStatus || 'FULL_TIME',
             salaryGroupId: emp.salaryGroup?.id || '',
             annualCtc: emp.annualCtc || '',
             drivingLicenseNumber: emp.drivingLicenseNumber || '',
             panNumber: emp.panNumber || '',
             voterIdNumber: emp.voterIdNumber || '',
             accountType: emp.bankAccounts?.[0]?.accountType || 'SAVINGS',
             accountHolderName: emp.bankAccounts?.[0]?.accountHolderName || '',
             accountNumber: emp.bankAccounts?.[0]?.accountNumber || '',
             ifscCode: emp.bankAccounts?.[0]?.ifscCode || ''
           });
        } else {
          // Fetch next auto-generated employee ID for new employees
          try {
            const nextIdRes = await axiosInstance.get('/employees/next-employee-id');
            const nextId = nextIdRes.data || nextIdRes;
            setNextEmployeeId(typeof nextId === 'string' ? nextId : '');
          } catch (e) {
            // Non-critical, ignore
          }
        }
      } catch (err) {
        alert('Initialization failed: ' + err.message);
      } finally {
        setLoadingLookups(false);
      }
    };
    init();
  }, [id, isEdit]);

  // Dynamically fetch designations based on selected departmentId
  useEffect(() => {
    if (lookups) {
      if (formData.departmentId) {
        LookupService.getDesignations(formData.departmentId).then(setDesignations).catch(() => setDesignations([]));
      } else {
        setDesignations(lookups.designations || []);
      }
    }
  }, [formData.departmentId, lookups]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const nextStep = () => setActiveTab(prev => Math.min(prev + 1, tabs.length - 1));
  const prevStep = () => setActiveTab(prev => Math.max(prev - 1, 0));

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      const payload = {
        name: formData.name, employeeId: formData.employeeId || null, workingEmail: formData.workingEmail, workingPhone: formData.workingPhone, joiningDate: formData.joiningDate, status: formData.status, address: formData.address, allowLogin: formData.allowLogin, password: formData.password || null,
        gender: formData.gender, dateOfBirth: formData.dateOfBirth, personalEmail: formData.personalEmail, personalPhone: formData.personalPhone, married: formData.married,
        locationId: parseInt(formData.locationId) || null, shiftId: parseInt(formData.shiftId) || null, departmentId: parseInt(formData.departmentId) || null, designationId: parseInt(formData.designationId) || null, reportToId: parseInt(formData.reportToId) || null, manager: formData.manager,
        probationStartDate: formData.probationStartDate || null, probationEndDate: formData.probationEndDate || null, noticeStartDate: null, noticeEndDate: null, endDate: null, employeeWorkStatus: formData.employeeWorkStatus,
        salaryGroupId: parseInt(formData.salaryGroupId) || null, annualCtc: parseFloat(formData.annualCtc) || null,
        drivingLicenseNumber: formData.drivingLicenseNumber, panNumber: formData.panNumber, voterIdNumber: formData.voterIdNumber,
        bankAccounts: formData.accountNumber ? [{
          accountType: formData.accountType, accountHolderName: formData.accountHolderName, accountNumber: formData.accountNumber, ifscCode: formData.ifscCode, primary: true
        }] : []
      };

      if (isEdit) {
        await axiosInstance.put(`/employees/${id}`, payload);
        alert('Employee Updated Successfully!');
        navigate('/employees');
      } else {
        const res = await axiosInstance.post('/employees', payload);
        const newEmployeeId = res.id || res.employeeId || res; 
        alert('Employee Created Successfully! Please upload documents.');
        navigate(`/employees/${newEmployeeId}/documents`);
      }
    } catch (err) {
      alert(err.message || `Error ${isEdit ? 'updating' : 'creating'} employee`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingLookups) return <div className="spinner mx-auto mt-10"></div>;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', margin: '0 0 8px 0' }}>{isEdit ? 'Edit' : 'Add'} Employee</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>{isEdit ? 'Modify employee configuration' : 'Onboard a new employee via the wizard'}.</p>
      </div>

      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
        {tabs.map((t, idx) => (
          <div key={t} onClick={() => setActiveTab(idx)} style={{ 
            padding: '8px 16px', cursor: 'pointer', borderRadius: '8px', 
            background: activeTab === idx ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
            color: activeTab === idx ? '#fff' : 'var(--text-muted)'
          }}>
            {idx + 1}. {t}
          </div>
        ))}
      </div>

      <div className="glass-panel text-[var(--text-main)]" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>
          <AnimatePresence mode='wait'>
            <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              {activeTab === 0 && (
                <>
                  <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
                  <Input label={`Employee ID ${nextEmployeeId ? `(Next: ${nextEmployeeId})` : '(Leave blank to auto-generate)'}`} name="employeeId" value={formData.employeeId} onChange={handleChange} placeholder={nextEmployeeId || 'Auto-generated'} />
                  <Input label="Company Email" type="email" name="workingEmail" value={formData.workingEmail} onChange={handleChange} required />
                  <Input label="Phone" name="workingPhone" value={formData.workingPhone} onChange={handleChange} required />
                  <Input label="Joining Date" type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} required />
                  <div className="input-group">
                    <label className="input-label">Status</label>
                    <select className="input-field" name="status" value={formData.status} onChange={handleChange}>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" name="allowLogin" checked={formData.allowLogin} onChange={handleChange} /> 
                    <label>Allow portal login (Creates system user)</label>
                  </div>
                  {formData.allowLogin && (
                    <Input label="Temporary Password" type="password" name="password" value={formData.password} onChange={handleChange} required />
                  )}
                </>
              )}

              {activeTab === 1 && (
                <>
                  <div className="input-group">
                    <label className="input-label">Gender</label>
                    <select className="input-field" name="gender" value={formData.gender} onChange={handleChange}>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <Input label="Date of Birth" type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />
                  <Input label="Personal Email" type="email" name="personalEmail" value={formData.personalEmail} onChange={handleChange} />
                  <Input label="Personal Phone" name="personalPhone" value={formData.personalPhone} onChange={handleChange} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" name="married" checked={formData.married} onChange={handleChange} /> 
                    <label>Married</label>
                  </div>
                </>
              )}

              {activeTab === 2 && (
                <>
                  <div className="input-group">
                    <label className="input-label">Department</label>
                    <select className="input-field" name="departmentId" value={formData.departmentId} onChange={handleChange}>
                      <option value="">Select...</option>
                      {lookups?.departments?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Designation</label>
                    <select className="input-field" name="designationId" value={formData.designationId} onChange={handleChange}>
                      <option value="">Select...</option>
                      {designations.map(d => <option key={d.id} value={d.id}>{d.name || d.title}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Location</label>
                    <select className="input-field" name="locationId" value={formData.locationId} onChange={handleChange}>
                      <option value="">Select...</option>
                      {lookups?.locations?.map(d => <option key={d.id} value={d.id}>{d.name || d.city}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Shift</label>
                    <select className="input-field" name="shiftId" value={formData.shiftId} onChange={handleChange}>
                      <option value="">Select...</option>
                      {lookups?.shifts?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </>
              )}

              {activeTab === 3 && (
                <>
                  <Input label="Probation Start Date" type="date" name="probationStartDate" value={formData.probationStartDate} onChange={handleChange} />
                  <Input label="Probation End Date" type="date" name="probationEndDate" value={formData.probationEndDate} onChange={handleChange} />
                  <div className="input-group">
                    <label className="input-label">Work Status</label>
                    <select className="input-field" name="employeeWorkStatus" value={formData.employeeWorkStatus} onChange={handleChange}>
                      <option value="FULL_TIME">Full Time</option>
                      <option value="PART_TIME">Part Time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="INTERN">Intern</option>
                      <option value="PROBATION">Probation</option>
                      <option value="NOTICE_PERIOD">Notice Period</option>
                      <option value="TERMINATED">Terminated</option>
                    </select>
                  </div>
                </>
              )}

              {activeTab === 4 && (
                <>
                  <div className="input-group">
                    <label className="input-label">Salary Group</label>
                    <select className="input-field" name="salaryGroupId" value={formData.salaryGroupId} onChange={handleChange}>
                      <option value="">Select...</option>
                      {lookups?.salaryGroups?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <Input label="Annual CTC (Gross)" type="number" name="annualCtc" value={formData.annualCtc} onChange={handleChange} />
                </>
              )}

              {activeTab === 5 && (
                <>
                  <Input label="PAN Number" name="panNumber" value={formData.panNumber} onChange={handleChange} />
                  <Input label="Driving License" name="drivingLicenseNumber" value={formData.drivingLicenseNumber} onChange={handleChange} />
                  <Input label="Bank Account Holder" name="accountHolderName" value={formData.accountHolderName} onChange={handleChange} />
                  <Input label="Bank Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleChange} />
                  <Input label="IFSC Code" name="ifscCode" value={formData.ifscCode} onChange={handleChange} />
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', borderTop: '1px solid var(--glass-border)', paddingTop: '24px' }}>
          <Button variant="ghost" onClick={prevStep} disabled={activeTab === 0}>Back</Button>
          {activeTab === tabs.length - 1 ? (
             <Button variant="primary" onClick={handleSubmit} loading={submitting}>Complete Onboarding</Button>
          ) : (
             <Button variant="primary" onClick={nextStep}>Next step</Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeWizard;
