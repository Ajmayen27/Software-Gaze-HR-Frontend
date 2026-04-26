import React, { useEffect, useState } from 'react';
import { axiosInstance } from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { UserPlus, Settings2, Trash2, FileUp, FileText, Search, ChevronLeft, ChevronRight, Eye, Edit3 } from 'lucide-react';

const EmployeeAvatar = ({ employee }) => {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let objectUrl = null;

    const fetchImage = async () => {
      try {
        let endpoint = `/employees/${employee.id}/documents/PROFILE_IMAGE/download`;
        const profileDoc = employee.documents?.find(d => d.documentType?.toLowerCase() === 'profile_image');
        
        if (profileDoc && profileDoc.downloadUrl) {
          endpoint = profileDoc.downloadUrl.startsWith('/api/v1') 
            ? profileDoc.downloadUrl.substring(7) 
            : profileDoc.downloadUrl;
        }

        const res = await axiosInstance.get(endpoint, { responseType: 'blob' });
        if (res && res.size > 0 && isMounted) {
          objectUrl = URL.createObjectURL(res);
          setImageUrl(objectUrl);
        }
      } catch (e) {
        // Fallback to initials quietly
      }
    };
    
    // Only fetch if employee object has a valid ID
    if (employee && employee.id) {
      fetchImage();
    }

    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [employee]);

  if (imageUrl) {
    return (
      <img 
        src={imageUrl} 
        alt={employee.name || 'Employee'} 
        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--glass-border)' }} 
      />
    );
  }

  return (
    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px', color: '#fff', flexShrink: 0 }}>
      {employee.name ? employee.name.charAt(0).toUpperCase() : 'U'}
    </div>
  );
};

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Pagination state
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  // Lookup by employee ID
  const [empIdSearch, setEmpIdSearch] = useState('');
  const [foundEmployee, setFoundEmployee] = useState(null);

  // Departments for filter dropdown
  const [departments, setDepartments] = useState([]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      let url = `/employees?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (departmentFilter) url += `&departmentId=${departmentFilter}`;

      const res = await axiosInstance.get(url);
      // The interceptor already unwraps ApiResponse<T>.data,
      // so `res` is now the PageData<EmployeeListResponse> directly.
      // Handle every possible shape defensively:
      let pageData = null;

      if (res && res.content && Array.isArray(res.content)) {
        // Shape: { content: [...], totalPages, totalElements, ... }
        pageData = res;
      } else if (res && res.data && res.data.content && Array.isArray(res.data.content)) {
        // Shape: { data: { content: [...] } } (if interceptor didn't unwrap)
        pageData = res.data;
      } else if (Array.isArray(res)) {
        // Shape: direct array
        pageData = { content: res, totalPages: 1, totalElements: res.length };
      } else if (res && res.data && Array.isArray(res.data)) {
        // Shape: { data: [...] }
        pageData = { content: res.data, totalPages: 1, totalElements: res.data.length };
      }

      if (pageData) {
        setEmployees(pageData.content);
        setTotalPages(pageData.totalPages || 0);
        setTotalElements(pageData.totalElements || 0);
      } else {
        console.warn('Unexpected employee list response shape:', res);
        setEmployees([]);
      }
    } catch (error) {
      console.error('Failed to load employees', error);
    } finally {
      setLoading(false);
    }
  };

  // Load departments for filter
  useEffect(() => {
    axiosInstance.get('/departments').then(res => {
      const list = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : []);
      setDepartments(list);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [page, statusFilter, departmentFilter, sortBy, sortDir]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(0);
      fetchEmployees();
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await axiosInstance.patch(`/employees/${id}/status?status=${newStatus}`);
      fetchEmployees();
    } catch (e) {
      alert('Failed to update status');
    }
  };

  const hardDelete = async (id) => {
    if (!window.confirm(`Permanently delete employee ID: ${id}? This cannot be undone.`)) return;
    try {
      await axiosInstance.delete(`/employees/${id}`);
      fetchEmployees();
    } catch (e) {
       alert('Delete failed.');
    }
  };

  const handleCsvImport = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      await axiosInstance.post('/employees/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Employees Imported Successfully!');
      fetchEmployees();
    } catch (err) {
      alert(`Import Failed: ${err.message}`);
      setLoading(false);
    }
  };

  // GET /employees/by-employee-id/{employeeId}
  const searchByEmployeeId = async () => {
    if (!empIdSearch.trim()) return;
    try {
      const res = await axiosInstance.get(`/employees/by-employee-id/${encodeURIComponent(empIdSearch.trim())}`);
      const emp = res.data || res;
      setFoundEmployee(emp);
    } catch (e) {
      alert('Employee not found with that ID.');
      setFoundEmployee(null);
    }
  };

  const thStyle = { padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '13px', whiteSpace: 'nowrap' };
  const tdStyle = { padding: '14px 16px', fontSize: '14px' };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', margin: '0 0 4px 0' }}>Employees</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            {totalElements > 0 ? `${totalElements} total employees` : 'Manage your team members and their details.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input type="file" id="csv-upload" style={{ display: 'none' }} accept=".csv" onChange={handleCsvImport} />
          <Button variant="ghost" onClick={() => document.getElementById('csv-upload').click()}>
            <FileUp size={16} /> Import CSV
          </Button>
          <Button onClick={() => navigate('/employees/new')} className="btn-primary">
            <UserPlus size={16} /> Add Employee
          </Button>
        </div>
      </div>

      {/* Search & Filters Row */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 220px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input-field"
            placeholder="Search name, email, phone, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
        <div className="input-group" style={{ width: '140px' }}>
          <select className="input-field" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        <div className="input-group" style={{ width: '160px' }}>
          <select className="input-field" value={departmentFilter} onChange={(e) => { setDepartmentFilter(e.target.value); setPage(0); }}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="input-group" style={{ width: '150px' }}>
          <select className="input-field" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="createdAt">Sort: Created</option>
            <option value="name">Sort: Name</option>
            <option value="joiningDate">Sort: Joining</option>
          </select>
        </div>
        <Button variant="ghost" style={{ padding: '10px' }} onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')} title="Toggle sort direction">
          {sortDir === 'asc' ? '↑' : '↓'}
        </Button>
      </div>

      {/* Lookup by Employee ID */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Find by HR ID:</span>
        <input
          className="input-field"
          placeholder="e.g. emp-0001"
          value={empIdSearch}
          onChange={(e) => setEmpIdSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchByEmployeeId()}
          style={{ maxWidth: '200px' }}
        />
        <Button variant="ghost" onClick={searchByEmployeeId} style={{ padding: '8px 12px' }}>
          <Search size={16} /> Lookup
        </Button>
        {foundEmployee && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px', padding: '8px 16px', background: 'rgba(110,86,207,0.1)', borderRadius: '8px' }}>
            <span style={{ fontWeight: 500 }}>{foundEmployee.name}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{foundEmployee.employeeId}</span>
            <Button variant="ghost" style={{ padding: '4px 8px' }} onClick={() => navigate(`/employees/${foundEmployee.id}/profile`)}>
              <Eye size={14} /> Profile
            </Button>
            <Button variant="ghost" style={{ padding: '4px 8px' }} onClick={() => navigate(`/employees/${foundEmployee.id}/edit`)}>
              <Edit3 size={14} /> Edit
            </Button>
            <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }} onClick={() => setFoundEmployee(null)}>✕</button>
          </div>
        )}
      </div>

      {/* Employee Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Employee ID</th>
                <th style={thStyle}>Department</th>
                <th style={thStyle}>Designation</th>
                <th style={thStyle}>Location</th>
                <th style={thStyle}>Joining Date</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ padding: '40px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No employees found.</td></tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <EmployeeAvatar employee={emp} />
                        <div>
                          <div style={{ fontWeight: 500 }}>{emp.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{emp.workingEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '13px' }}>{emp.employeeId || '—'}</td>
                    <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{emp.department || '—'}</td>
                    <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{emp.designation || '—'}</td>
                    <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{emp.location || '—'}</td>
                    <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: '13px' }}>{emp.joiningDate || '—'}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
                        background: emp.status === 'ACTIVE' ? 'rgba(48,164,108,0.15)' : 'rgba(229,72,77,0.15)',
                        color: emp.status === 'ACTIVE' ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {emp.status}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                        <Button variant="ghost" style={{ padding: '6px' }} onClick={() => navigate(`/employees/${emp.id}/profile`)} title="View Profile">
                          <Eye size={15} />
                        </Button>
                        <Button variant="ghost" style={{ padding: '6px' }} onClick={() => navigate(`/employees/${emp.id}/edit`)} title="Edit Employee">
                          <Edit3 size={15} />
                        </Button>
                        <Button variant="ghost" style={{ padding: '6px' }} onClick={() => navigate(`/employees/${emp.id}/documents`)} title="Documents">
                          <FileText size={15} />
                        </Button>
                        <Button variant="ghost" style={{ padding: '6px' }} onClick={() => toggleStatus(emp.id, emp.status)} title="Toggle Status">
                          {emp.status === 'ACTIVE' ? <Trash2 size={15} color="var(--danger)" /> : <span style={{ fontSize: '11px', color: 'var(--success)' }}>✓</span>}
                        </Button>
                        <Button variant="ghost" style={{ padding: '6px' }} onClick={() => hardDelete(emp.id)} title="Permanently Delete">
                          <Trash2 size={15} color="var(--warning)" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--glass-border)', fontSize: '13px', color: 'var(--text-muted)' }}>
            <span>Page {page + 1} of {totalPages} ({totalElements} results)</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="ghost" style={{ padding: '6px 10px' }} disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={16} /> Prev
              </Button>
              <Button variant="ghost" style={{ padding: '6px 10px' }} disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                Next <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeList;
