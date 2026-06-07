import React, { useEffect, useState, useCallback } from 'react';
import { axiosInstance } from '../api/axiosInstance';
import { LookupService } from '../api/lookups';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { UserPlus, Users, ShieldCheck, Search, ChevronLeft, ChevronRight, Eye, Edit3, Trash2, FileUp, Upload, Filter, X, Check, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getSupportStaffList } from '../api/support';

const RegisterSupportStaffModal = ({ onClose }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await axiosInstance.post('/auth/support-staff/register', form);
      toast.success('Support staff registered successfully');
      onClose();
    } catch (err) {
      toast.error(err?.message || err?.response?.data?.message || 'Registration failed');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (name, value) => {
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', margin: 0, color: 'var(--text-primary)' }}>Register Support Staff</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Create a new support staff account. Only administrators can do this.</p>
          </div>
          <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="input-group">
            <label className="input-label">Full Name *</label>
            <input className={`input-field ${errors.name ? 'input-error' : ''}`} placeholder="e.g. Support Agent"
              value={form.name} onChange={e => handleChange('name', e.target.value)} />
            {errors.name && <span className="input-error-msg">{errors.name}</span>}
          </div>

          <div className="input-group">
            <label className="input-label">Email Address *</label>
            <input type="email" className={`input-field ${errors.email ? 'input-error' : ''}`} placeholder="support-agent@example.com"
              value={form.email} onChange={e => handleChange('email', e.target.value)} />
            {errors.email && <span className="input-error-msg">{errors.email}</span>}
          </div>

          <div className="input-group">
            <label className="input-label">Password *</label>
            <input type="password" className={`input-field ${errors.password ? 'input-error' : ''}`} placeholder="Minimum 6 characters"
              value={form.password} onChange={e => handleChange('password', e.target.value)} />
            {errors.password && <span className="input-error-msg">{errors.password}</span>}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <div className="spinner" style={{ width: '16px', height: '16px' }} /> : <><Check size={16} /> Register</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EmployeeList = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  const { role } = useAuth();
  const isAdmin = role === 'ROLE_ADMIN';
  const [currentTab, setCurrentTab] = useState('employees'); // 'employees' | 'support'
  const [supportStaff, setSupportStaff] = useState([]);
  const [loadingSupport, setLoadingSupport] = useState(false);

  const fetchSupportStaff = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingSupport(true);
    try {
      const res = await getSupportStaffList();
      const data = res?.data || res || [];
      setSupportStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load support staff:', err);
    } finally {
      setLoadingSupport(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchSupportStaff();
  }, [fetchSupportStaff]);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [shiftFilter, setShiftFilter] = useState('');

  // Lookup data for filters
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [shifts, setShifts] = useState([]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load filter lookups
  useEffect(() => {
    LookupService.getDepartments().then(setDepartments).catch(() => { });
    LookupService.getLocations().then(setLocations).catch(() => { });
    LookupService.getDesignations().then(setDesignations).catch(() => { });
    LookupService.getShifts().then(setShifts).catch(() => { });
  }, []);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('size', size);
      params.set('sortBy', sortBy);
      params.set('sortDir', sortDir);
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (departmentFilter) params.set('departmentId', departmentFilter);
      if (locationFilter) params.set('locationId', locationFilter);
      if (designationFilter) params.set('designationId', designationFilter);
      if (shiftFilter) params.set('shiftId', shiftFilter);

      const res = await axiosInstance.get(`/employees?${params.toString()}`);

      // Handle different response shapes
      if (res && res.content) {
        setEmployees(res.content);
        setTotalPages(res.totalPages || 1);
        setTotalElements(res.totalElements || res.content.length);
      } else if (Array.isArray(res)) {
        setEmployees(res);
        setTotalPages(1);
        setTotalElements(res.length);
      } else if (res?.data?.content) {
        setEmployees(res.data.content);
        setTotalPages(res.data.totalPages || 1);
        setTotalElements(res.data.totalElements || 0);
      } else {
        setEmployees([]);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  }, [page, size, sortBy, sortDir, search, statusFilter, departmentFilter, locationFilter, designationFilter, shiftFilter]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete employee "${name}"? This action cannot be undone.`)) return;
    try {
      await axiosInstance.delete(`/employees/${id}`);
      toast.success('Employee deleted');
      fetchEmployees();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const handleToggleStatus = async (emp) => {
    const newStatus = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await axiosInstance.patch(`/employees/${emp.id}/status?status=${newStatus}`);
      toast.success(`Status changed to ${newStatus}`);
      fetchEmployees();
    } catch (err) {
      toast.error(err.message || 'Status change failed');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axiosInstance.post('/employees/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Import successful!');
      fetchEmployees();
    } catch (err) {
      toast.error(err.message || 'Import failed');
    }
  };

  const activeFilters = [statusFilter, departmentFilter, locationFilter, designationFilter, shiftFilter].filter(Boolean).length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>{currentTab === 'support' ? 'Support Staff' : 'Employees'}</h1>
          <p>
            {currentTab === 'support'
              ? `${supportStaff.length} support agent${supportStaff.length !== 1 ? 's' : ''}`
              : `${totalElements} total employee${totalElements !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {currentTab === 'employees' && (
            <>
              <div style={{ position: 'relative' }}>
                <input type="file" accept=".csv" style={{ display: 'none' }} id="csv-import" onChange={handleImport} />
                <Button variant="ghost" onClick={() => document.getElementById('csv-import').click()}>
                  <Upload size={14} /> Import CSV
                </Button>
              </div>
              <Button className="btn-primary" onClick={() => navigate('/employees/new')}>
                <UserPlus size={14} /> Add Employee
              </Button>
            </>
          )}
          {isAdmin && (
            <Button variant="secondary" onClick={() => { setShowSupportModal(true); }}>
              <UserPlus size={14} /> Register Support
            </Button>
          )}
        </div>
      </div>

      {/* Tab Switcher — Admin only */}
      {isAdmin && (
        <div style={{ display: 'flex', gap: '4px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
          <button
            id="tab-employees"
            onClick={() => setCurrentTab('employees')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 18px', borderRadius: '7px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 500, transition: 'all 0.2s',
              background: currentTab === 'employees' ? 'var(--primary)' : 'transparent',
              color: currentTab === 'employees' ? '#fff' : 'var(--text-muted)',
            }}
          >
            <Users size={14} /> Employees
          </button>
          <button
            id="tab-support-staff"
            onClick={() => { setCurrentTab('support'); fetchSupportStaff(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 18px', borderRadius: '7px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 500, transition: 'all 0.2s',
              background: currentTab === 'support' ? 'var(--primary)' : 'transparent',
              color: currentTab === 'support' ? '#fff' : 'var(--text-muted)',
            }}
          >
            <ShieldCheck size={14} /> Support Staff
          </button>
        </div>
      )}

      {/* ── EMPLOYEES TAB ─────────────────────────────────────────── */}
      {currentTab === 'employees' && (
        <>
          {/* Search & Filters Bar */}
          <div className="card card-compact" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Search size={16} color="var(--text-muted)" />
            <input className="input-field" placeholder="Search by name, email, ID or phone..."
              value={searchInput} onChange={e => setSearchInput(e.target.value)}
              style={{ border: 'none', padding: '4px 0', boxShadow: 'none', flex: 1 }} />
            <Button variant="ghost" onClick={() => setShowFilters(!showFilters)} style={{ position: 'relative' }}>
              <Filter size={14} /> Filters
              {activeFilters > 0 && <span className="badge badge-info" style={{ position: 'absolute', top: '-4px', right: '-4px', fontSize: '9px', padding: '0 4px', minWidth: '16px', height: '16px', lineHeight: '16px', textAlign: 'center' }}>{activeFilters}</span>}
            </Button>
            <div className="input-group" style={{ width: '140px' }}>
              <select className="input-field" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '6px 8px', fontSize: '12px' }}>
                <option value="createdAt">Sort: Date Added</option>
                <option value="name">Sort: Name</option>
                <option value="joiningDate">Sort: Joining</option>
              </select>
            </div>
          </div>

          {/* Filter Row */}
          {showFilters && (
            <div className="card card-compact" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <select className="input-field" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} style={{ width: '130px', padding: '6px 8px', fontSize: '12px' }}>
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <select className="input-field" value={departmentFilter} onChange={e => { setDepartmentFilter(e.target.value); setPage(0); }} style={{ width: '150px', padding: '6px 8px', fontSize: '12px' }}>
                <option value="">All Departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select className="input-field" value={locationFilter} onChange={e => { setLocationFilter(e.target.value); setPage(0); }} style={{ width: '140px', padding: '6px 8px', fontSize: '12px' }}>
                <option value="">All Locations</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <select className="input-field" value={designationFilter} onChange={e => { setDesignationFilter(e.target.value); setPage(0); }} style={{ width: '150px', padding: '6px 8px', fontSize: '12px' }}>
                <option value="">All Designations</option>
                {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select className="input-field" value={shiftFilter} onChange={e => { setShiftFilter(e.target.value); setPage(0); }} style={{ width: '130px', padding: '6px 8px', fontSize: '12px' }}>
                <option value="">All Shifts</option>
                {shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {activeFilters > 0 && (
                <Button variant="ghost" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => { setStatusFilter(''); setDepartmentFilter(''); setLocationFilter(''); setDesignationFilter(''); setShiftFilter(''); setPage(0); }}>
                  <X size={12} /> Clear
                </Button>
              )}
            </div>
          )}

          {/* Employee Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Location</th>
                  <th>Joining</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '48px' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                ) : employees.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '14px', marginBottom: '8px' }}>No employees found</div>
                    <Button className="btn-primary btn-sm" onClick={() => navigate('/employees/new')}>
                      <UserPlus size={14} /> Add First Employee
                    </Button>
                  </td></tr>
                ) : (
                  employees.map(emp => (
                    <tr key={emp.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/employees/${emp.id}/profile`)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '12px', flexShrink: 0 }}>
                            {emp.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '13px' }}>
                              {emp.name}
                              {emp.manager && <span className="badge badge-info" style={{ marginLeft: '6px', fontSize: '9px', padding: '0 5px' }}>MGR</span>}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.workingEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{emp.employeeId || '—'}</td>
                      <td>{emp.department || '—'}</td>
                      <td>{emp.designation || '—'}</td>
                      <td>{emp.location || '—'}</td>
                      <td style={{ fontSize: '12px' }}>{emp.joiningDate || '—'}</td>
                      <td>
                        <span className={`badge ${emp.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}
                          onClick={(e) => { e.stopPropagation(); handleToggleStatus(emp); }}
                          style={{ cursor: 'pointer' }} title="Click to toggle">
                          {emp.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '2px', justifyContent: 'flex-end' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/employees/${emp.id}/profile`)} title="View"><Eye size={14} /></button>
                          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/employees/${emp.id}/edit`)} title="Edit"><Edit3 size={14} /></button>
                          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/employees/${emp.id}/documents`)} title="Documents"><FileUp size={14} /></button>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(emp.id, emp.name)} title="Delete"><Trash2 size={14} color="var(--danger)" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span>Page {page + 1} of {totalPages} ({totalElements} records)</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── SUPPORT STAFF TAB ─────────────────────────────────────── */}
      {currentTab === 'support' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Table toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              <ShieldCheck size={15} style={{ marginRight: '6px', verticalAlign: 'middle', color: 'var(--primary)' }} />
              Support Agents
            </span>
            <button
              id="btn-refresh-support"
              className="btn btn-ghost btn-sm"
              onClick={fetchSupportStaff}
              title="Refresh list"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Agent</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {loadingSupport ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '48px' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : supportStaff.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    <ShieldCheck size={32} style={{ opacity: 0.3, marginBottom: '10px', display: 'block', margin: '0 auto 10px' }} />
                    <div style={{ fontSize: '14px', marginBottom: '8px' }}>No support staff registered yet</div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowSupportModal(true)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', fontSize: '12px' }}
                    >
                      <UserPlus size={13} /> Register First Agent
                    </button>
                  </td>
                </tr>
              ) : (
                supportStaff.map((agent, idx) => (
                  <tr key={agent.id ?? idx}>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)', width: '48px' }}>{idx + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)',
                          color: '#fff', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0
                        }}>
                          {(agent.name || agent.email || 'S').charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '13px' }}>
                          {agent.name || '—'}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{agent.email}</td>
                    <td>
                      <span className="badge badge-info" style={{ fontSize: '10px' }}>Support Staff</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {supportStaff.length > 0 && (
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-muted)' }}>
              {supportStaff.length} agent{supportStaff.length !== 1 ? 's' : ''} registered
            </div>
          )}
        </div>
      )}

      {/* Register Support Staff Modal */}
      {showSupportModal && (
        <RegisterSupportStaffModal onClose={() => { setShowSupportModal(false); if (currentTab === 'support') fetchSupportStaff(); }} />
      )}
    </div>
  );
};

export default EmployeeList;
