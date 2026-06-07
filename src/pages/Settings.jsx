import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../api/axiosInstance';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  { label: 'Departments', endpoint: '/departments', fields: ['name', 'description'] },
  { label: 'Designations', endpoint: '/designations', fields: ['name', 'description', 'departmentId'] },
  { label: 'Locations', endpoint: '/locations', fields: ['name', 'address', 'city', 'country'] },
  { label: 'Shifts', endpoint: '/shifts', fields: ['name', 'startTime', 'endTime', 'description'] },
  { label: 'Salary Groups', endpoint: '/salary-groups', fields: ['name', 'description', 'basicSalaryPercentage'] }
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]); // needed for Designation lookup

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  const tab = TABS[activeTab];

  // Helper: safely extract array from response
  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    if (res && Array.isArray(res.content)) return res.content;
    return [];
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(tab.endpoint);
      setData(toArray(res));

      // If Designations tab, we need departments for dropdowns
      if (tab.label === 'Designations') {
        const deptRes = await axiosInstance.get('/departments');
        setDepartments(toArray(deptRes));
      }
    } catch (err) {
      alert('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setFormData({ ...item, departmentId: item.department ? item.department.id : '' });
    } else {
      const emptyForm = {};
      tab.fields.forEach(f => emptyForm[f] = f.includes('Percentage') ? 0 : '');
      setFormData(emptyForm);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({});
    setEditingItem(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Clean payload numbers
      const payload = { ...formData };
      if (payload.departmentId) payload.departmentId = parseInt(payload.departmentId);
      if (payload.basicSalaryPercentage) payload.basicSalaryPercentage = parseFloat(payload.basicSalaryPercentage);

      if (editingItem) {
        await axiosInstance.put(`${tab.endpoint}/${editingItem.id}`, payload);
      } else {
        await axiosInstance.post(tab.endpoint, payload);
      }
      handleCloseModal();
      fetchData();
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record configuration permanently?')) return;
    try {
      await axiosInstance.delete(`${tab.endpoint}/${id}`);
      fetchData();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      <div>
        <h1 style={{ fontSize: '24px', margin: '0 0 8px 0' }}>System Settings</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Configure platform master data and lookups.</p>
      </div>

      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
        {TABS.map((t, idx) => (
          <div key={t.label} onClick={() => setActiveTab(idx)} style={{
            padding: '8px 16px', cursor: 'pointer', borderRadius: '8px', fontWeight: activeTab === idx ? 600 : 400,
            background: activeTab === idx ? 'var(--primary)' : 'transparent',
            color: activeTab === idx ? '#fff' : 'var(--text-muted)',
            transition: 'all 0.2s'
          }}>
            {t.label}
          </div>
        ))}
      </div>

      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)' }}>
          <h3 style={{ margin: 0 }}>{tab.label} Dictionary</h3>
          <Button onClick={() => handleOpenModal()} className="btn-primary" style={{ padding: '6px 12px' }}>
            <Plus size={16} /> Add {tab.label.slice(0, -1)}
          </Button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '12px 24px', color: 'var(--text-muted)', fontWeight: 500 }}>ID</th>
                <th style={{ padding: '12px 24px', color: 'var(--text-muted)', fontWeight: 500 }}>Name</th>
                {tab.fields.map(f => (
                  f !== 'name' && f !== 'departmentId' && <th key={f} style={{ padding: '12px 24px', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'capitalize' }}>{f.replace(/([A-Z])/g, ' $1')}</th>
                ))}
                {tab.label === 'Designations' && <th style={{ padding: '12px 24px', color: 'var(--text-muted)', fontWeight: 500 }}>Department</th>}
                <th style={{ padding: '12px 24px', color: 'var(--text-muted)', fontWeight: 500, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="10" style={{ padding: '24px', textAlign: 'center' }}><div className="spinner mx-auto" /></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="10" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No configurations found.</td></tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '12px 24px', color: 'var(--text-muted)' }}>{row.id}</td>
                    <td style={{ padding: '12px 24px', fontWeight: 500 }}>{row.name}</td>
                    {tab.fields.map(f => (
                      f !== 'name' && f !== 'departmentId' && <td key={f} style={{ padding: '12px 24px', color: 'var(--text-muted)' }}>{row[f]}</td>
                    ))}
                    {tab.label === 'Designations' && <td style={{ padding: '12px 24px', color: 'var(--text-muted)' }}>{row.department?.name}</td>}

                    <td style={{ padding: '12px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <Button variant="ghost" style={{ padding: '6px' }} onClick={() => handleOpenModal(row)}>
                          <Edit2 size={16} color="var(--info)" />
                        </Button>
                        <Button variant="ghost" style={{ padding: '6px' }} onClick={() => handleDelete(row.id)}>
                          <Trash2 size={16} color="var(--danger)" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic Modal */}
      <AnimatePresence>
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-panel" style={{ width: '400px', background: 'var(--bg-color)' }}>
              <h2 style={{ fontSize: '20px', marginBottom: '24px' }}>{editingItem ? 'Edit' : 'Add'} {tab.label.slice(0, -1)}</h2>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {tab.fields.map(f => {
                  if (f === 'description') return <Input key={f} label="Description" name={f} value={formData[f] || ''} onChange={handleChange} />;
                  if (f === 'startTime' || f === 'endTime') return <Input key={f} type="time" label={f.replace(/([A-Z])/g, ' $1')} name={f} value={formData[f] || ''} onChange={handleChange} step="1" required />;
                  if (f === 'basicSalaryPercentage') return <Input key={f} type="number" label="Basic Salary %" name={f} value={formData[f] || ''} onChange={handleChange} required />;
                  if (f === 'departmentId') return (
                    <div key={f} className="input-group">
                      <label className="input-label">Department Mapping</label>
                      <select className="input-field" name={f} value={formData[f] || ''} onChange={handleChange} required>
                        <option value="">Select Department...</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  );
                  return <Input key={f} label={f.charAt(0).toUpperCase() + f.slice(1)} name={f} value={formData[f] || ''} onChange={handleChange} required />;
                })}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                  <Button type="button" variant="ghost" onClick={handleCloseModal}>Cancel</Button>
                  <Button type="submit" variant="primary">Save Changes</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;
