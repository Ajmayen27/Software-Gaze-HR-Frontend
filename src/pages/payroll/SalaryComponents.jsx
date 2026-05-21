import React, { useState, useEffect } from 'react';
import { PayrollService } from '../../api/payroll';
import { formatBDT } from '../../utils/currency';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Layers } from 'lucide-react';
import { toast } from 'react-hot-toast';

const TYPE_COLORS = {
  EARNING: 'badge-success',
  DEDUCTION: 'badge-danger',
  EMPLOYER_CONTRIBUTION: 'badge-info',
};

const CALC_TYPES = ['FIXED', 'PERCENTAGE_OF_BASIC', 'PERCENTAGE_OF_GROSS', 'PERCENTAGE_OF_CTC'];
const COMPONENT_TYPES = ['EARNING', 'DEDUCTION', 'EMPLOYER_CONTRIBUTION'];

const SalaryComponents = () => {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', type: 'EARNING', calculationType: 'FIXED', value: '', displayOrder: '', active: true,
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await PayrollService.getSalaryComponents();
      setComponents(data || []);
    } catch (err) {
      toast.error('Failed to load salary components');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openModal = (item = null) => {
    setEditing(item);
    setForm(item ? { ...item } : { name: '', description: '', type: 'EARNING', calculationType: 'FIXED', value: '', displayOrder: '', active: true });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, value: Number(form.value), displayOrder: Number(form.displayOrder) };
      if (editing) {
        await PayrollService.updateSalaryComponent(editing.id, payload);
        toast.success('Salary component updated');
      } else {
        await PayrollService.createSalaryComponent(payload);
        toast.success('Salary component created');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to save component');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this salary component?')) return;
    try {
      await PayrollService.deleteSalaryComponent(id);
      toast.success('Salary component deleted');
      setComponents(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      toast.error(err.message || 'Failed to delete component');
    }
  };

  const toggleActive = async (c) => {
    try {
      const payload = { ...c, active: !c.active };
      await PayrollService.updateSalaryComponent(c.id, payload);
      setComponents(prev => prev.map(comp => comp.id === c.id ? { ...comp, active: !c.active } : comp));
      toast.success(`Component ${!c.active ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const sorted = [...components].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  const earnings = sorted.filter(c => c.type === 'EARNING');
  const deductions = sorted.filter(c => c.type === 'DEDUCTION');
  const employer = sorted.filter(c => c.type === 'EMPLOYER_CONTRIBUTION');

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="page-header">
        <div>
          <h1>Salary Components</h1>
          <p>Define earnings, deductions, and employer contributions for payroll.</p>
        </div>
        <Button className="btn-primary" onClick={() => openModal()}>
          <Plus size={14} /> Add Component
        </Button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { label: 'Earnings', count: earnings.length, color: 'var(--success)', bg: 'var(--success-light)' },
          { label: 'Deductions', count: deductions.length, color: 'var(--danger)', bg: 'var(--danger-light)' },
          { label: 'Employer Contributions', count: employer.length, color: 'var(--info)', bg: 'var(--info-light)' },
        ].map(g => (
          <div key={g.label} className="card card-compact" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: g.bg, color: g.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={18} />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700 }}>{g.count}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{g.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Type</th>
              <th>Calculation</th>
              <th>Value</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No salary components configured.</td></tr>
            ) : (
              sorted.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.displayOrder}</td>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.name}</div>
                    {c.description && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.description}</div>}
                  </td>
                  <td><span className={`badge ${TYPE_COLORS[c.type]}`}>{c.type.replace(/_/g, ' ')}</span></td>
                  <td style={{ fontSize: '12px' }}>{c.calculationType?.replace(/_/g, ' ')}</td>
                  <td style={{ fontWeight: 600 }}>
                    {c.calculationType === 'FIXED' ? formatBDT(c.value) : `${c.value}%`}
                  </td>
                  <td>
                    <button onClick={() => toggleActive(c)} className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }}>
                      {c.active ? <ToggleRight size={18} color="var(--success)" /> : <ToggleLeft size={18} color="var(--text-muted)" />}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openModal(c)}><Edit2 size={14} /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(c.id)}><Trash2 size={14} color="var(--danger)" /></button>
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
              style={{ width: '440px' }} onClick={e => e.stopPropagation()}>
              <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>{editing ? 'Edit' : 'Add'} Salary Component</h2>
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Input label="Name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <Input label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                <div className="input-group">
                  <label className="input-label">Type</label>
                  <select className="input-field" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    {COMPONENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Calculation Type</label>
                  <select className="input-field" value={form.calculationType} onChange={e => setForm({ ...form, calculationType: e.target.value })}>
                    {CALC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Input label={form.calculationType === 'FIXED' ? 'Amount (BDT)' : 'Percentage (%)'} type="number" step="0.01" required value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} />
                  <Input label="Display Order" type="number" value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: e.target.value })} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
                  <label style={{ fontSize: '13px' }}>Active</label>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <Button type="button" variant="ghost" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
                  <Button type="submit" className="btn-primary" disabled={saving}>{saving ? <div className="spinner" style={{ width: '14px', height: '14px' }} /> : 'Save'}</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SalaryComponents;
