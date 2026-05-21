import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../api/axiosInstance';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, Plus, Search } from 'lucide-react';

// Helper: safely extract array
const toArray = (res) => {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  if (res && Array.isArray(res.content)) return res.content;
  return [];
};

/**
 * Generic CRUD page for lookup tables (Departments, Designations, etc.)
 * @param {object} config - { title, subtitle, endpoint, fields, extraFetch? }
 */
const LookupPage = ({ title, subtitle, endpoint, fields, extraFetch }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [extra, setExtra] = useState({}); // For extra lookup data

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(endpoint);
      setData(toArray(res));
      if (extraFetch) {
        const extraData = await extraFetch();
        setExtra(extraData);
      }
    } catch (err) {
      console.error('Load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [endpoint]);

  const openModal = (item = null) => {
    setEditing(item);
    if (item) {
      const populated = { ...item };
      // Flatten nested objects (e.g. department.id -> departmentId)
      fields.forEach(f => {
        if (f.key.endsWith('Id') && item[f.key.replace('Id', '')]) {
          populated[f.key] = item[f.key.replace('Id', '')].id;
        }
      });
      setForm(populated);
    } else {
      const empty = {};
      fields.forEach(f => empty[f.key] = f.default || '');
      setForm(empty);
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      fields.forEach(f => {
        if (f.type === 'number' && payload[f.key]) payload[f.key] = Number(payload[f.key]);
      });
      if (editing) {
        await axiosInstance.put(`${endpoint}/${editing.id}`, payload);
      } else {
        await axiosInstance.post(endpoint, payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this record permanently?')) return;
    try {
      await axiosInstance.delete(`${endpoint}/${id}`);
      fetchData();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const filtered = data.filter(row => {
    if (!search) return true;
    const s = search.toLowerCase();
    return fields.some(f => String(row[f.key] || '').toLowerCase().includes(s)) || String(row.name || '').toLowerCase().includes(s);
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <Button className="btn-primary" onClick={() => openModal()}>
          <Plus size={14} /> Add {title.replace(/s$/, '')}
        </Button>
      </div>

      {/* Search */}
      <div className="card card-compact" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Search size={16} color="var(--text-muted)" />
        <input className="input-field" placeholder={`Search ${title.toLowerCase()}...`} value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', padding: '4px 0', boxShadow: 'none' }} />
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              {fields.filter(f => f.key !== 'name' && f.showInTable !== false).map(f => (
                <th key={f.key}>{f.label}</th>
              ))}
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '32px' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No records found.</td></tr>
            ) : (
              filtered.map(row => (
                <tr key={row.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>{row.id}</td>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{row.name}</td>
                  {fields.filter(f => f.key !== 'name' && f.showInTable !== false).map(f => (
                    <td key={f.key}>
                      {f.key === 'departmentId' ? (row.department?.name || '—') : (row[f.key] ?? '—')}
                    </td>
                  ))}
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openModal(row)}><Edit2 size={14} /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(row.id)}><Trash2 size={14} color="var(--danger)" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div className="modal-content" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ width: '420px' }} onClick={e => e.stopPropagation()}>
              <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>{editing ? 'Edit' : 'Add'} {title.replace(/s$/, '')}</h2>
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {fields.map(f => {
                  if (f.key === 'departmentId') {
                    return (
                      <div key={f.key} className="input-group">
                        <label className="input-label">{f.label}</label>
                        <select className="input-field" value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} required={f.required}>
                          <option value="">Select...</option>
                          {(extra.departments || []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                    );
                  }
                  return (
                    <Input key={f.key} label={f.label} type={f.type === 'number' ? 'number' : f.type === 'time' ? 'time' : 'text'}
                      required={f.required} value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      step={f.type === 'time' ? '1' : undefined} />
                  );
                })}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button type="submit" className="btn-primary">Save</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LookupPage;
