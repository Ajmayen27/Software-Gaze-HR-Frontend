import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PayrollService } from '../../api/payroll';
import { formatBDT } from '../../utils/currency';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Eye, Play, CheckCircle, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_BADGE = {
  DRAFT: 'badge-draft',
  PROCESSED: 'badge-warning',
  APPROVED: 'badge-success',
};

const PayrollRuns = () => {
  const navigate = useNavigate();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), notes: '', processImmediately: false });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await PayrollService.getPayrollRuns();
      setRuns(data || []);
    } catch (err) {
      toast.error('Failed to load payroll runs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        month: Number(form.month),
        year: Number(form.year),
        notes: form.notes,
        processImmediately: form.processImmediately,
      };
      await PayrollService.createPayrollRun(payload);
      toast.success('Payroll run created');
      setShowModal(false);
      setForm({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), notes: '', processImmediately: false });
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to create payroll run');
    } finally {
      setSaving(false);
    }
  };

  const processRun = async (id) => {
    if (!confirm('Process this payroll run? This will generate payslips for all eligible employees.')) return;
    try {
      await PayrollService.processPayrollRun(id);
      toast.success('Payroll run processed successfully');
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to process payroll run');
    }
  };

  const approveRun = async (id) => {
    if (!confirm('Approve this payroll run? This action is final and payslips will be visible to employees.')) return;
    try {
      await PayrollService.approvePayrollRun(id);
      toast.success('Payroll run approved');
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to approve payroll run');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="page-header">
        <div>
          <h1>Payroll Runs</h1>
          <p>Create, process, and approve monthly payroll cycles.</p>
        </div>
        <Button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={14} /> Create Payroll Run
        </Button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { label: 'Draft', count: runs.filter(r => r.status === 'DRAFT').length, cls: 'badge-draft' },
          { label: 'Processed', count: runs.filter(r => r.status === 'PROCESSED').length, cls: 'badge-warning' },
          { label: 'Approved', count: runs.filter(r => r.status === 'APPROVED').length, cls: 'badge-success' },
        ].map(s => (
          <div key={s.label} className="card card-compact" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>{s.count}</div>
            <span className={`badge ${s.cls}`}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Status</th>
              <th>Employees</th>
              <th>Gross Salary</th>
              <th>Deductions</th>
              <th>Net Salary</th>
              <th>CTC</th>
              <th>Notes</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '32px' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : runs.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No payroll runs found.</td></tr>
            ) : (
              runs.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={14} color="var(--text-muted)" />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{MONTHS[r.month - 1]} {r.year}</span>
                    </div>
                  </td>
                  <td><span className={`badge ${STATUS_BADGE[r.status]}`}>{r.status}</span></td>
                  <td>{r.employeeCount || 0}</td>
                  <td style={{ fontWeight: 500 }}>{formatBDT(r.totalGrossSalary || r.totalGross || 0)}</td>
                  <td style={{ color: 'var(--danger)' }}>{formatBDT(r.totalDeductions || 0)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--success)' }}>{formatBDT(r.totalNetSalary || r.totalNet || 0)}</td>
                  <td>{formatBDT(r.totalCtc || 0)}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.notes || '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/payroll/runs/${r.id}`)} title="View"><Eye size={14} /></button>
                      {r.status === 'DRAFT' && <button className="btn btn-ghost btn-sm" onClick={() => processRun(r.id)} title="Process"><Play size={14} color="var(--warning)" /></button>}
                      {r.status === 'PROCESSED' && <button className="btn btn-ghost btn-sm" onClick={() => approveRun(r.id)} title="Approve"><CheckCircle size={14} color="var(--success)" /></button>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div className="modal-content" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ width: '400px' }} onClick={e => e.stopPropagation()}>
              <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Create Payroll Run</h2>
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="input-group">
                    <label className="input-label">Month</label>
                    <select className="input-field" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })}>
                      {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                  <Input label="Year" type="number" required value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
                </div>
                <Input label="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" checked={form.processImmediately} onChange={e => setForm({ ...form, processImmediately: e.target.checked })} />
                  <label style={{ fontSize: '13px' }}>Process immediately after creation</label>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <Button type="button" variant="ghost" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
                  <Button type="submit" className="btn-primary" disabled={saving}>{saving ? <div className="spinner" style={{ width: '14px', height: '14px' }} /> : 'Create Run'}</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PayrollRuns;
