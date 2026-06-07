import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LookupService } from '../../api/lookups';
import { axiosInstance } from '../../api/axiosInstance';
import { useParams, useNavigate } from 'react-router-dom';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { toast } from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

const tabs = ['Basic Info', 'Personal', 'Company', 'Timeline', 'Salary & IDs', 'Bank & Docs'];

const EmployeeWizard = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lookups, setLookups] = useState(null);
  const [designations, setDesignations] = useState([]);
  const [employees, setEmployees] = useState([]); // For reportTo dropdown

  const [formData, setFormData] = useState({
    // Basic Info (Tab 0)
    name: '',
    employeeId: '',
    workingEmail: '',
    workingPhone: '',
    profileImageUrl: '',
    joiningDate: '',
    status: 'ACTIVE',
    address: '',
    allowLogin: false,
    password: '',
    // Personal (Tab 1)
    gender: 'MALE',
    dateOfBirth: '',
    personalEmail: '',
    personalPhone: '',
    married: false,
    // Company (Tab 2)
    locationId: '',
    shiftId: '',
    departmentId: '',
    designationId: '',
    reportToId: '',
    manager: false,
    // Timeline (Tab 3)
    probationStartDate: '',
    probationEndDate: '',
    noticeStartDate: '',
    noticeEndDate: '',
    endDate: '',
    employeeWorkStatus: 'FULL_TIME',
    // Salary & IDs (Tab 4)
    salaryGroupId: '',
    annualCtc: '',
    drivingLicenseNumber: '',
    panNumber: '',
    voterIdNumber: '',
    // Bank & Docs (Tab 5)
    accountType: 'SAVINGS',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    drivingLicenseDocUrl: '',
    panCardDocUrl: '',
    voterIdDocUrl: '',
  });

  const [nextEmployeeId, setNextEmployeeId] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const refs = await LookupService.fetchAllLookups();
        setLookups(refs);

        // Fetch employee list for reportTo dropdown
        try {
          const empRes = await axiosInstance.get('/employees?page=0&size=100&sortBy=name&sortDir=asc');
          const empList = empRes?.content || (Array.isArray(empRes) ? empRes : []);
          setEmployees(empList);
        } catch { }

        if (isEdit) {
          const res = await axiosInstance.get(`/employees/${id}`);
          const emp = res.data || res;

          setFormData({
            name: emp.name || '',
            employeeId: emp.employeeId || '',
            workingEmail: emp.workingEmail || '',
            workingPhone: emp.workingPhone || '',
            profileImageUrl: emp.profileImageUrl || '',
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
            noticeStartDate: emp.noticeStartDate || '',
            noticeEndDate: emp.noticeEndDate || '',
            endDate: emp.endDate || '',
            employeeWorkStatus: emp.employeeWorkStatus || 'FULL_TIME',
            salaryGroupId: emp.salaryGroup?.id || '',
            annualCtc: emp.annualCtc || '',
            drivingLicenseNumber: emp.drivingLicenseNumber || '',
            panNumber: emp.panNumber || '',
            voterIdNumber: emp.voterIdNumber || '',
            accountType: emp.bankAccounts?.[0]?.accountType || 'SAVINGS',
            accountHolderName: emp.bankAccounts?.[0]?.accountHolderName || '',
            accountNumber: emp.bankAccounts?.[0]?.accountNumber || '',
            ifscCode: emp.bankAccounts?.[0]?.ifscCode || '',
            drivingLicenseDocUrl: '',
            panCardDocUrl: '',
            voterIdDocUrl: '',
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
        toast.error('Initialization failed: ' + err.message);
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
    // Validate required fields
    if (!formData.name?.trim()) { toast.error('Name is required'); setActiveTab(0); return; }
    if (!formData.workingEmail?.trim()) { toast.error('Working Email is required'); setActiveTab(0); return; }
    if (!formData.joiningDate) { toast.error('Joining Date is required'); setActiveTab(0); return; }

    try {
      setSubmitting(true);

      const payload = {
        name: formData.name,
        employeeId: formData.employeeId || null,
        workingEmail: formData.workingEmail,
        workingPhone: formData.workingPhone || null,
        profileImageUrl: formData.profileImageUrl || null,
        joiningDate: formData.joiningDate,
        status: formData.status || 'ACTIVE',
        address: formData.address || null,
        allowLogin: formData.allowLogin,
        password: formData.allowLogin ? (formData.password || null) : null,
        gender: formData.gender || null,
        dateOfBirth: formData.dateOfBirth || null,
        personalEmail: formData.personalEmail || null,
        personalPhone: formData.personalPhone || null,
        married: formData.married,
        locationId: formData.locationId ? parseInt(formData.locationId) : null,
        shiftId: formData.shiftId ? parseInt(formData.shiftId) : null,
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
        designationId: formData.designationId ? parseInt(formData.designationId) : null,
        reportToId: formData.reportToId ? parseInt(formData.reportToId) : null,
        manager: formData.manager,
        probationStartDate: formData.probationStartDate || null,
        probationEndDate: formData.probationEndDate || null,
        noticeStartDate: formData.noticeStartDate || null,
        noticeEndDate: formData.noticeEndDate || null,
        endDate: formData.endDate || null,
        employeeWorkStatus: formData.employeeWorkStatus || 'FULL_TIME',
        salaryGroupId: formData.salaryGroupId ? parseInt(formData.salaryGroupId) : null,
        annualCtc: formData.annualCtc ? parseFloat(formData.annualCtc) : null,
        drivingLicenseNumber: formData.drivingLicenseNumber || null,
        panNumber: formData.panNumber || null,
        voterIdNumber: formData.voterIdNumber || null,
        drivingLicenseDocUrl: formData.drivingLicenseDocUrl || null,
        panCardDocUrl: formData.panCardDocUrl || null,
        voterIdDocUrl: formData.voterIdDocUrl || null,
        bankAccounts: formData.accountNumber ? [{
          accountType: formData.accountType || 'SAVINGS',
          accountHolderName: formData.accountHolderName || null,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode || null,
          primary: true
        }] : []
      };

      if (isEdit) {
        await axiosInstance.put(`/employees/${id}`, payload);
        toast.success('Employee updated successfully!');
        navigate('/employees');
      } else {
        const res = await axiosInstance.post('/employees', payload);
        const newId = res?.id || res;
        toast.success('Employee created successfully!');
        if (newId && typeof newId === 'number') {
          navigate(`/employees/${newId}/documents`);
        } else {
          navigate('/employees');
        }
      }
    } catch (err) {
      toast.error(err.message || `Error ${isEdit ? 'updating' : 'creating'} employee`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingLookups) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
      <div className="spinner" />
    </div>
  );

  const SelectField = ({ label, name, value, options, required }) => (
    <div className="input-group">
      <label className="input-label">{label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}</label>
      <select className="input-field" name={name} value={value} onChange={handleChange} required={required}>
        <option value="">Select...</option>
        {options.map(o => <option key={o.id} value={o.id}>{o.name || o.title || o.employeeId}</option>)}
      </select>
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit' : 'Add New'} Employee</h1>
          <p>{isEdit ? 'Update employee information' : 'Fill all sections to complete onboarding'}</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/employees')}>
          <ArrowLeft size={14} /> Back to List
        </Button>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border-color)', overflowX: 'auto' }}>
        {tabs.map((t, idx) => (
          <div key={t} onClick={() => setActiveTab(idx)} style={{
            padding: '8px 16px', cursor: 'pointer', whiteSpace: 'nowrap',
            fontSize: '13px', fontWeight: activeTab === idx ? 600 : 400,
            color: activeTab === idx ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === idx ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom: '-1px',
          }}>
            {idx + 1}. {t}
          </div>
        ))}
      </div>

      {/* Form Content */}
      <div className="card" style={{ minHeight: '420px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>
          <AnimatePresence mode='wait'>
            <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

              {/* ────── TAB 0: BASIC INFO ────── */}
              {activeTab === 0 && (
                <>
                  <Input label="Full Name *" name="name" value={formData.name} onChange={handleChange} required placeholder="Employee full name" />
                  <Input label={`Employee ID ${nextEmployeeId ? `(Next: ${nextEmployeeId})` : '(Auto-generated)'}`} name="employeeId" value={formData.employeeId} onChange={handleChange} placeholder={nextEmployeeId || 'Leave blank to auto-generate'} />
                  <Input label="Work Email *" type="email" name="workingEmail" value={formData.workingEmail} onChange={handleChange} required placeholder="name@company.com" />
                  <Input label="Work Phone" name="workingPhone" value={formData.workingPhone} onChange={handleChange} placeholder="+880 1763111024" />
                  <Input label="Joining Date *" type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} required />
                  <div className="input-group">
                    <label className="input-label">Status</label>
                    <select className="input-field" name="status" value={formData.status} onChange={handleChange}>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Input label="Address" name="address" value={formData.address} onChange={handleChange} placeholder="Full residential address" />
                  </div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
                    <input type="checkbox" id="allowLogin" name="allowLogin" checked={formData.allowLogin} onChange={handleChange} />
                    <label htmlFor="allowLogin" style={{ fontSize: '13px' }}>Allow portal login (creates system user account)</label>
                  </div>
                  {formData.allowLogin && (
                    <Input label="Temporary Password *" type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Min 8 characters" />
                  )}
                </>
              )}

              {/* ────── TAB 1: PERSONAL ────── */}
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
                  <Input label="Personal Email" type="email" name="personalEmail" value={formData.personalEmail} onChange={handleChange} placeholder="personal@email.com" />
                  <Input label="Personal Phone" name="personalPhone" value={formData.personalPhone} onChange={handleChange} placeholder="+880 1XXXXXXXXX" />
                  <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
                    <input type="checkbox" id="married" name="married" checked={formData.married} onChange={handleChange} />
                    <label htmlFor="married" style={{ fontSize: '13px' }}>Married</label>
                  </div>
                  <Input label="Profile Image URL" name="profileImageUrl" value={formData.profileImageUrl} onChange={handleChange} placeholder="https://... (optional)" />
                </>
              )}

              {/* ────── TAB 2: COMPANY ────── */}
              {activeTab === 2 && (
                <>
                  <SelectField label="Department" name="departmentId" value={formData.departmentId} options={lookups?.departments || []} />
                  <SelectField label="Designation" name="designationId" value={formData.designationId} options={designations} />
                  <SelectField label="Location" name="locationId" value={formData.locationId} options={lookups?.locations || []} />
                  <SelectField label="Shift" name="shiftId" value={formData.shiftId} options={lookups?.shifts || []} />
                  <SelectField label="Reports To" name="reportToId" value={formData.reportToId}
                    options={employees.filter(e => String(e.id) !== String(id)).map(e => ({ id: e.id, name: `${e.name} (${e.employeeId || e.id})` }))} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '24px' }}>
                    <input type="checkbox" id="manager" name="manager" checked={formData.manager} onChange={handleChange} />
                    <label htmlFor="manager" style={{ fontSize: '13px' }}>This employee is a manager</label>
                  </div>
                </>
              )}

              {/* ────── TAB 3: TIMELINE ────── */}
              {activeTab === 3 && (
                <>
                  <div className="input-group">
                    <label className="input-label">Employment Type</label>
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
                  <div /> {/* spacer */}
                  <Input label="Probation Start Date" type="date" name="probationStartDate" value={formData.probationStartDate} onChange={handleChange} />
                  <Input label="Probation End Date" type="date" name="probationEndDate" value={formData.probationEndDate} onChange={handleChange} />
                  <Input label="Notice Start Date" type="date" name="noticeStartDate" value={formData.noticeStartDate} onChange={handleChange} />
                  <Input label="Notice End Date" type="date" name="noticeEndDate" value={formData.noticeEndDate} onChange={handleChange} />
                  <Input label="End Date (Termination / Last Working)" type="date" name="endDate" value={formData.endDate} onChange={handleChange} />
                </>
              )}

              {/* ────── TAB 4: SALARY & IDs ────── */}
              {activeTab === 4 && (
                <>
                  <SelectField label="Salary Group" name="salaryGroupId" value={formData.salaryGroupId} options={lookups?.salaryGroups || []} />
                  <Input label="Annual CTC (BDT)" type="number" name="annualCtc" value={formData.annualCtc} onChange={handleChange} placeholder="e.g. 636000" />
                  <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-color)', margin: '8px 0', paddingTop: '12px' }}>
                    <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 12px' }}>Identification Documents</h4>
                  </div>
                  <Input label="PAN Number" name="panNumber" value={formData.panNumber} onChange={handleChange} placeholder="ABCDE1234F" />
                  <Input label="Voter ID Number" name="voterIdNumber" value={formData.voterIdNumber} onChange={handleChange} />
                  <Input label="Driving License Number" name="drivingLicenseNumber" value={formData.drivingLicenseNumber} onChange={handleChange} />
                </>
              )}

              {/* ────── TAB 5: BANK & DOCS ────── */}
              {activeTab === 5 && (
                <>
                  <div style={{ gridColumn: '1 / -1', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Primary Bank Account</h4>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Account Type</label>
                    <select className="input-field" name="accountType" value={formData.accountType} onChange={handleChange}>
                      <option value="SAVINGS">Savings</option>
                      <option value="CURRENT">Current</option>
                      <option value="SALARY">Salary</option>
                    </select>
                  </div>
                  <Input label="Account Holder Name" name="accountHolderName" value={formData.accountHolderName} onChange={handleChange} />
                  <Input label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleChange} />
                  <Input label="IFSC / Routing Code" name="ifscCode" value={formData.ifscCode} onChange={handleChange} />

                  <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-color)', margin: '8px 0', paddingTop: '12px' }}>
                    <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 12px' }}>Document URLs (optional — upload after creation)</h4>
                  </div>
                  <Input label="Driving License Doc URL" name="drivingLicenseDocUrl" value={formData.drivingLicenseDocUrl} onChange={handleChange} placeholder="https://..." />
                  <Input label="PAN Card Doc URL" name="panCardDocUrl" value={formData.panCardDocUrl} onChange={handleChange} placeholder="https://..." />
                  <Input label="Voter ID Doc URL" name="voterIdDocUrl" value={formData.voterIdDocUrl} onChange={handleChange} placeholder="https://..." />
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <Button variant="ghost" onClick={prevStep} disabled={activeTab === 0}>
            <ArrowLeft size={14} /> Back
          </Button>
          {activeTab === tabs.length - 1 ? (
            <Button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <div className="spinner" style={{ width: '14px', height: '14px' }} /> : <Check size={14} />}
              {isEdit ? 'Update Employee' : 'Complete Onboarding'}
            </Button>
          ) : (
            <Button className="btn-primary" onClick={nextStep}>
              Next Step <ArrowRight size={14} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeWizard;
