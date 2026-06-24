import React, { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Receipt, Plus, Search, X, Download, ChevronLeft, ChevronRight,
  Trash2, Edit2, Eye, FileText, Upload, AlertTriangle,
  TrendingUp, TrendingDown, DollarSign, Clock, ChevronDown,
  Calendar, Filter, RefreshCw, Paperclip, ExternalLink
} from 'lucide-react';
import {
  ExpenseService, downloadBlob, openBlobInTab,
  TAG_OPTIONS, TAG_BADGE_CLASS,
} from '../../api/expense';

// ── Utility ──────────────────────────────────────────────────────────────────
const fmt = (amount) =>
  new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(amount ?? 0);

const fmtDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const today = () => new Date().toISOString().slice(0, 10);

const DEFAULT_BILL_TYPES = [
  'Electricity',
  'Water Bill',
  'Gas Bill',
  'Internet Bill',
  'House Rent',
  'Office Rent',
  'Office Supplies',
  'Software Subscription',
  'Travel Expense',
  'Miscellaneous',
];

const EMPTY_FORM = {
  billType: '',
  amount: '',
  comment: '',
  tag: 'Paid',
  date: today(),
};

// ── Sub-components ────────────────────────────────────────────────────────────

const TagBadge = ({ tag }) => (
  <span className={`badge ${TAG_BADGE_CLASS[tag] || 'badge-draft'}`}>{tag}</span>
);

const SlipIndicator = ({ hasSlip }) =>
  hasSlip ? (
    <span title="Has transaction slip" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
      <Paperclip size={13} /> Slip
    </span>
  ) : (
    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
  );

// KPI Summary Card
const SummaryCard = ({ icon: Icon, label, value, iconBg, iconColor, trend }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ background: iconBg }}>
      <Icon size={20} color={iconColor} />
    </div>
    <div style={{ minWidth: 0 }}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {trend !== undefined && (
        <div style={{ fontSize: 11, marginTop: 4, color: trend >= 0 ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: 3 }}>
          {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  </div>
);

// ── Export Dropdown ───────────────────────────────────────────────────────────
const ExportDropdown = ({ filters, exporting, onExport }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const options = [
    { label: 'Current Month', key: 'current-month' },
    { label: 'Current Year', key: 'current-year' },
    { label: 'Daily Report', key: 'daily' },
    { label: 'Monthly Report', key: 'monthly' },
    { label: 'Yearly Report', key: 'yearly' },
    { label: 'Custom Range', key: 'range' },
  ];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="btn btn-secondary"
        onClick={() => setOpen(v => !v)}
        disabled={exporting}
        id="expense-export-btn"
      >
        {exporting ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Download size={15} />}
        Export PDF
        <ChevronDown size={13} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: 10, boxShadow: 'var(--shadow-lg)', zIndex: 50,
          minWidth: 180, overflow: 'hidden',
        }}>
          {options.map(opt => (
            <button
              key={opt.key}
              style={{
                width: '100%', padding: '10px 16px', background: 'none',
                border: 'none', textAlign: 'left', cursor: 'pointer',
                fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-family)',
                transition: 'background 0.1s',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-body)'}
              onMouseOut={e => e.currentTarget.style.background = 'none'}
              onClick={() => { setOpen(false); onExport(opt.key); }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── File Upload Zone ──────────────────────────────────────────────────────────
const FileUploadZone = ({ file, onChange, existingFileName, onRemoveExisting, showRemoveExisting }) => {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onChange(dropped);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label className="input-label">Transaction Slip (optional)</label>

      {existingFileName && showRemoveExisting && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
          background: 'var(--primary-light)', borderRadius: 8, fontSize: 12,
        }}>
          <Paperclip size={13} color="var(--primary)" />
          <span style={{ flex: 1, color: 'var(--text-primary)', fontWeight: 500 }}>{existingFileName}</span>
          <button
            type="button"
            onClick={onRemoveExisting}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 2 }}
            title="Remove existing slip"
          >
            <X size={13} />
          </button>
        </div>
      )}

      <div
        style={{
          border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--border-color)'}`,
          borderRadius: 10,
          padding: '20px 16px',
          textAlign: 'center',
          background: dragging ? 'var(--primary-light)' : 'var(--bg-body)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={20} color={dragging ? 'var(--primary)' : 'var(--text-muted)'} style={{ marginBottom: 8 }} />
        {file ? (
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{file.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {(file.size / 1024).toFixed(1)} KB
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
              Click to upload or drag & drop
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              PNG, JPG, PDF up to 10MB
            </div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf"
          style={{ display: 'none' }}
          onChange={e => { if (e.target.files[0]) onChange(e.target.files[0]); }}
        />
      </div>

      {file && (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => onChange(null)}
          style={{ alignSelf: 'flex-start', color: 'var(--danger)' }}
        >
          <X size={12} /> Remove new file
        </button>
      )}
    </div>
  );
};

// ── Expense Form Modal ────────────────────────────────────────────────────────
const ExpenseModal = ({ mode, initial, onClose, onSaved }) => {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [removeExistingSlip, setRemoveExistingSlip] = useState(false);
  const isEdit = mode === 'edit';

  const set = (field) => (e) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.billType.trim()) return toast.error('Bill type is required.');
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      return toast.error('Enter a valid positive amount.');
    if (!form.date) return toast.error('Date is required.');

    setLoading(true);
    try {
      let payload;
      const hasFile = file !== null;
      const needsMultipart = hasFile;

      if (needsMultipart) {
        payload = new FormData();
        const requestBlob = new Blob(
          [JSON.stringify({
            billType: form.billType,
            amount: Number(form.amount),
            comment: form.comment,
            tag: form.tag,
            date: form.date,
          })],
          { type: 'application/json' }
        );
        payload.append('request', requestBlob);
        payload.append('file', file);
      } else {
        payload = {
          billType: form.billType,
          amount: Number(form.amount),
          comment: form.comment,
          tag: form.tag,
          date: form.date,
        };
      }

      if (isEdit) {
        await ExpenseService.updateExpense(initial.id, payload);
        toast.success('Expense updated successfully!');
      } else {
        await ExpenseService.createExpense(payload);
        toast.success('Expense created successfully!');
      }
      onSaved();
    } catch (err) {
      toast.error(err.message || 'Failed to save expense.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content animate-fade-in" style={{ width: '100%', maxWidth: 520 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 18, margin: 0 }}>
              {isEdit ? 'Edit Expense' : 'Create Expense'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              {isEdit ? 'Update the expense record below.' : 'Fill in the details to add a new expense.'}
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} id="expense-modal-close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Row: Bill Type + Amount */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="input-label">Bill Type *</label>
              <input
                className="input-field"
                placeholder="e.g. Electricity, Rent"
                value={form.billType}
                onChange={set('billType')}
                id="expense-billType"
                list="modal-bill-types"
              />
              <datalist id="modal-bill-types">
                {DEFAULT_BILL_TYPES.map(type => (
                  <option key={type} value={type} />
                ))}
              </datalist>
            </div>
            <div className="input-group">
              <label className="input-label">Amount (BDT) *</label>
              <input
                className="input-field"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={set('amount')}
                id="expense-amount"
              />
            </div>
          </div>

          {/* Row: Tag + Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="input-label">Tag *</label>
              <select className="input-field" value={form.tag} onChange={set('tag')} id="expense-tag">
                {TAG_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Date *</label>
              <input
                className="input-field"
                type="date"
                value={form.date}
                onChange={set('date')}
                id="expense-date"
              />
            </div>
          </div>

          {/* Comment */}
          <div className="input-group">
            <label className="input-label">Comment</label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Optional notes about this expense..."
              value={form.comment}
              onChange={set('comment')}
              id="expense-comment"
              style={{ resize: 'vertical', minHeight: 72 }}
            />
          </div>

          {/* File upload */}
          <FileUploadZone
            file={file}
            onChange={setFile}
            existingFileName={isEdit && initial?.hasSlip ? initial.fileName : null}
            showRemoveExisting={!removeExistingSlip}
            onRemoveExisting={() => setRemoveExistingSlip(true)}
          />

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} id="expense-submit-btn">
              {loading && <div className="spinner" style={{ width: 14, height: 14, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />}
              {isEdit ? 'Update Expense' : 'Create Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
const DeleteModal = ({ expense, onClose, onDeleted }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await ExpenseService.deleteExpense(expense.id);
      toast.success('Expense deleted.');
      onDeleted();
    } catch (err) {
      toast.error(err.message || 'Failed to delete expense.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content animate-fade-in" style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12,
            background: 'var(--danger-light)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={24} color="var(--danger)" />
          </div>
          <div>
            <h2 style={{ fontSize: 17, margin: '0 0 6px' }}>Delete Expense?</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
              This will permanently remove the expense for{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{expense.billType}</strong>{' '}
              on <strong style={{ color: 'var(--text-primary)' }}>{fmtDate(expense.date)}</strong>.
              {expense.hasSlip && ' The transaction slip will also be deleted.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={loading} id="expense-delete-confirm-btn">
              {loading && <div className="spinner" style={{ width: 14, height: 14, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />}
              Delete Expense
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Detail Drawer / Modal ─────────────────────────────────────────────────────
const DetailModal = ({ expense, onClose, onEdit, onDeleted }) => {
  const [slipLoading, setSlipLoading] = useState(false);
  const [deleteSlipLoading, setDeleteSlipLoading] = useState(false);
  const [localExpense, setLocalExpense] = useState(expense);

  const handleDownloadSlip = async () => {
    setSlipLoading(true);
    try {
      const blob = await ExpenseService.downloadSlip(localExpense.id);
      openBlobInTab(blob);
    } catch (err) {
      toast.error(err.message || 'Failed to download slip.');
    } finally {
      setSlipLoading(false);
    }
  };

  const handleDeleteSlip = async () => {
    if (!window.confirm('Remove the transaction slip? The expense record will be kept.')) return;
    setDeleteSlipLoading(true);
    try {
      await ExpenseService.deleteSlip(localExpense.id);
      setLocalExpense(prev => ({ ...prev, hasSlip: false, fileName: null, fileSize: 0 }));
      toast.success('Transaction slip removed.');
    } catch (err) {
      toast.error(err.message || 'Failed to remove slip.');
    } finally {
      setDeleteSlipLoading(false);
    }
  };

  const InfoRow = ({ label, value, children }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, width: 120, flexShrink: 0, paddingTop: 1 }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, flex: 1 }}>
        {children || value || '—'}
      </span>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content animate-fade-in" style={{ width: '100%', maxWidth: 500 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: 'var(--primary-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Receipt size={20} color="var(--primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: 17, margin: 0 }}>{localExpense.billType}</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                Expense #{localExpense.id}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <TagBadge tag={localExpense.tag} />
            <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        {/* Amount highlight */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, #6366F1 100%)',
          borderRadius: 12, padding: '16px 20px', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>Total Amount</span>
          <span style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>{fmt(localExpense.amount)}</span>
        </div>

        {/* Details */}
        <div>
          <InfoRow label="Date">{fmtDate(localExpense.date)}</InfoRow>
          <InfoRow label="Bill Type">{localExpense.billType}</InfoRow>
          <InfoRow label="Comment">{localExpense.comment || '—'}</InfoRow>
          <InfoRow label="Created">{fmtDate(localExpense.createdAt)}</InfoRow>
          <InfoRow label="Last Updated">{fmtDate(localExpense.updatedAt)}</InfoRow>

          {/* Slip section */}
          <div style={{ padding: '10px 0' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Transaction Slip</span>
            {localExpense.hasSlip ? (
              <div style={{
                marginTop: 8, padding: '10px 12px',
                background: 'var(--bg-body)', borderRadius: 8,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <FileText size={16} color="var(--primary)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {localExpense.fileName || 'Transaction Slip'}
                  </div>
                  {localExpense.fileSize > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {(localExpense.fileSize / 1024).toFixed(1)} KB
                    </div>
                  )}
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleDownloadSlip}
                  disabled={slipLoading}
                  title="View / Download slip"
                >
                  {slipLoading
                    ? <div className="spinner" style={{ width: 12, height: 12, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                    : <ExternalLink size={12} />}
                  View
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleDeleteSlip}
                  disabled={deleteSlipLoading}
                  title="Remove slip"
                  style={{ color: 'var(--danger)' }}
                >
                  {deleteSlipLoading
                    ? <div className="spinner" style={{ width: 12, height: 12 }} />
                    : <Trash2 size={12} />}
                </button>
              </div>
            ) : (
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                No transaction slip attached.
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={() => { onClose(); onEdit(localExpense); }}>
            <Edit2 size={13} /> Edit Expense
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Export Modal (for reports requiring extra parameters) ─────────────────────
const ExportReportModal = ({ reportType, filters, onClose }) => {
  const [params, setParams] = useState({
    date: today(),
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    startDate: filters.startDate || '',
    endDate: filters.endDate || '',
    tag: filters.tag || '',
    billType: filters.billType || '',
  });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setParams(prev => ({ ...prev, [k]: e.target.value }));

  const handleExport = async () => {
    setLoading(true);
    try {
      let blob;
      const common = { tag: params.tag || undefined, billType: params.billType || undefined };

      switch (reportType) {
        case 'daily':
          if (!params.date) return toast.error('Date is required.');
          blob = await ExpenseService.exportDailyReport({ date: params.date, ...common });
          downloadBlob(blob, `expense-daily-${params.date}.pdf`);
          break;
        case 'monthly':
          blob = await ExpenseService.exportMonthlyReport({ year: params.year, month: params.month, ...common });
          downloadBlob(blob, `expense-monthly-${params.year}-${params.month}.pdf`);
          break;
        case 'yearly':
          blob = await ExpenseService.exportYearlyReport({ year: params.year, ...common });
          downloadBlob(blob, `expense-yearly-${params.year}.pdf`);
          break;
        case 'current-month':
          blob = await ExpenseService.exportCurrentMonthReport(common);
          downloadBlob(blob, `expense-current-month.pdf`);
          break;
        case 'current-year':
          blob = await ExpenseService.exportCurrentYearReport(common);
          downloadBlob(blob, `expense-current-year.pdf`);
          break;
        case 'range':
          if (!params.startDate || !params.endDate) return toast.error('Both start and end date are required.');
          blob = await ExpenseService.exportRangeReport({ startDate: params.startDate, endDate: params.endDate, ...common });
          downloadBlob(blob, `expense-range-${params.startDate}-to-${params.endDate}.pdf`);
          break;
        default:
          break;
      }
      toast.success('Report downloaded!');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to export report.');
    } finally {
      setLoading(false);
    }
  };

  const titleMap = {
    daily: 'Daily Report', monthly: 'Monthly Report', yearly: 'Yearly Report',
    'current-month': 'Current Month Report', 'current-year': 'Current Year Report',
    range: 'Custom Date Range Report',
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content animate-fade-in" style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 17, margin: 0 }}>Export: {titleMap[reportType]}</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Configure parameters and download the PDF report.
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Date-specific fields */}
          {reportType === 'daily' && (
            <div className="input-group">
              <label className="input-label">Date *</label>
              <input className="input-field" type="date" value={params.date} onChange={set('date')} />
            </div>
          )}
          {reportType === 'monthly' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="input-group">
                <label className="input-label">Year</label>
                <input className="input-field" type="number" value={params.year} onChange={set('year')} />
              </div>
              <div className="input-group">
                <label className="input-label">Month</label>
                <select className="input-field" value={params.month} onChange={set('month')}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {reportType === 'yearly' && (
            <div className="input-group">
              <label className="input-label">Year</label>
              <input className="input-field" type="number" value={params.year} onChange={set('year')} />
            </div>
          )}
          {reportType === 'range' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="input-group">
                <label className="input-label">Start Date *</label>
                <input className="input-field" type="date" value={params.startDate} onChange={set('startDate')} />
              </div>
              <div className="input-group">
                <label className="input-label">End Date *</label>
                <input className="input-field" type="date" value={params.endDate} onChange={set('endDate')} />
              </div>
            </div>
          )}

          {/* Common filters */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="input-label">Filter by Tag</label>
              <select className="input-field" value={params.tag} onChange={set('tag')}>
                <option value="">All</option>
                {TAG_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Filter by Bill Type</label>
              <input
                className="input-field"
                placeholder="e.g. Electricity"
                value={params.billType}
                onChange={set('billType')}
                list="export-bill-types"
              />
              <datalist id="export-bill-types">
                {DEFAULT_BILL_TYPES.map(type => (
                  <option key={type} value={type} />
                ))}
              </datalist>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleExport} disabled={loading}>
              {loading
                ? <div className="spinner" style={{ width: 14, height: 14, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                : <Download size={14} />}
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const ExpensePage = () => {
  // ── State
  const [expenses, setExpenses] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [summary, setSummary] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    startDate: '', endDate: '', tag: '', billType: '',
    page: 0, size: 10, sortBy: 'date', sortDir: 'desc',
  });
  const [pendingFilters, setPendingFilters] = useState({
    startDate: '', endDate: '', tag: '', billType: '',
  });

  // Modals
  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'delete' | 'detail' | { export: type }
  const [selected, setSelected] = useState(null);

  // ── Data Loading
  const loadExpenses = useCallback(async (f = filters) => {
    setLoading(true);
    try {
      const params = {
        ...(f.startDate && { startDate: f.startDate }),
        ...(f.endDate && { endDate: f.endDate }),
        ...(f.tag && { tag: f.tag }),
        ...(f.billType && { billType: f.billType }),
        page: f.page,
        size: f.size,
        sortBy: f.sortBy,
        sortDir: f.sortDir,
      };
      const res = await ExpenseService.getExpenses(params);
      // Handle paginated response
      if (res && res.content !== undefined) {
        setExpenses(res.content);
        setTotalPages(res.totalPages ?? 0);
        setTotalElements(res.totalElements ?? 0);
      } else if (Array.isArray(res)) {
        setExpenses(res);
        setTotalPages(1);
        setTotalElements(res.length);
      } else {
        setExpenses([]);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load expenses.');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Compute summary by fetching ALL current-month expenses and summing tag-wise.
  // Uses end-of-month as endDate so future-dated records within the month are included.
  // Tag comparison is case-insensitive to handle any backend casing (Paid / PAID / paid).
  const loadSummary = useCallback(async () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth(); // 0-indexed
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      // Last day of the current month (not today) so future-dated records are included
      const lastDay = new Date(year, month + 1, 0).getDate();
      const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      // Fetch a large batch to cover all current-month records
      const res = await ExpenseService.getExpenses({
        startDate,
        endDate,
        page: 0,
        size: 10000,
        sortBy: 'date',
        sortDir: 'desc',
      });

      const all = res?.content ?? (Array.isArray(res) ? res : []);

      const calc = { totalAmount: 0, paidAmount: 0, unpaidAmount: 0, dueAmount: 0 };
      for (const exp of all) {
        const amt = Number(exp.amount) || 0;
        calc.totalAmount += amt;
        if (exp.tag === 'Paid')   calc.paidAmount   += amt;
        if (exp.tag === 'Unpaid') calc.unpaidAmount += amt;
        if (exp.tag === 'Due')    calc.dueAmount    += amt;
      }

      setSummary(calc);
    } catch (err) {
      console.warn('[ExpensePage] Summary calculation failed:', err);
    }
  }, []);

  useEffect(() => {
    loadExpenses(filters);
  }, [filters]);

  useEffect(() => {
    loadSummary();
  }, []);

  const handleRefresh = () => {
    loadExpenses(filters);
    loadSummary();
  };

  // ── Filter Apply
  const handleApplyFilters = () => {
    const newFilters = { ...filters, ...pendingFilters, page: 0 };
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    const reset = { startDate: '', endDate: '', tag: '', billType: '' };
    setPendingFilters(reset);
    setFilters(prev => ({ ...prev, ...reset, page: 0 }));
  };

  // ── Modal helpers
  const openCreate = () => { setSelected(null); setModal('create'); };
  const openEdit = (exp) => { setSelected(exp); setModal('edit'); };
  const openDelete = (exp) => { setSelected(exp); setModal('delete'); };
  const openDetail = (exp) => { setSelected(exp); setModal('detail'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleSaved = () => {
    closeModal();
    loadExpenses(filters);
    loadSummary();
  };

  const handleDeleted = () => {
    closeModal();
    // If we're on a now-empty page, go back
    const newPage = expenses.length === 1 && filters.page > 0 ? filters.page - 1 : filters.page;
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    loadSummary();
  };

  // ── Export
  const handleExport = (type) => {
    setModal({ export: type });
  };

  // ── Pagination
  const goToPage = (p) => setFilters(prev => ({ ...prev, page: p }));

  // summary now has a known, calculated shape:
  // { totalAmount, paidAmount, unpaidAmount, dueAmount }
  const getSummaryVal = (key) => summary?.[key] ?? 0;

  // ── Render
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Page Header */}
      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Receipt size={22} color="var(--primary)" />
            Expenses
          </h1>
          <p>Track, manage, and report on all company expenses.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleRefresh}
            title="Refresh"
            id="expense-refresh-btn"
          >
            <RefreshCw size={14} />
          </button>
          <ExportDropdown filters={filters} exporting={exporting} onExport={handleExport} />
          <button className="btn btn-primary" onClick={openCreate} id="expense-create-btn">
            <Plus size={15} /> Add Expense
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <SummaryCard
          icon={DollarSign}
          label="Total This Month"
          value={fmt(getSummaryVal('totalAmount'))}
          iconBg="var(--primary-light)"
          iconColor="var(--primary)"
        />
        <SummaryCard
          icon={Receipt}
          label="Paid"
          value={fmt(getSummaryVal('paidAmount'))}
          iconBg="var(--success-light)"
          iconColor="var(--success)"
        />
        <SummaryCard
          icon={Clock}
          label="Unpaid"
          value={fmt(getSummaryVal('unpaidAmount'))}
          iconBg="var(--warning-light)"
          iconColor="var(--warning)"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Due"
          value={fmt(getSummaryVal('dueAmount'))}
          iconBg="var(--danger-light)"
          iconColor="var(--danger)"
        />
      </div>

      {/* ── Filter Bar */}
      <div className="card card-compact">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', flexShrink: 0 }}>
            <Filter size={15} />
            <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Filters</span>
          </div>

          <div className="input-group" style={{ minWidth: 140, maxWidth: 180 }}>
            <label className="input-label">Start Date</label>
            <input
              className="input-field"
              type="date"
              value={pendingFilters.startDate}
              onChange={e => setPendingFilters(p => ({ ...p, startDate: e.target.value }))}
              id="filter-startDate"
            />
          </div>

          <div className="input-group" style={{ minWidth: 140, maxWidth: 180 }}>
            <label className="input-label">End Date</label>
            <input
              className="input-field"
              type="date"
              value={pendingFilters.endDate}
              onChange={e => setPendingFilters(p => ({ ...p, endDate: e.target.value }))}
              id="filter-endDate"
            />
          </div>

          <div className="input-group" style={{ minWidth: 120, maxWidth: 160 }}>
            <label className="input-label">Tag</label>
            <select
              className="input-field"
              value={pendingFilters.tag}
              onChange={e => setPendingFilters(p => ({ ...p, tag: e.target.value }))}
              id="filter-tag"
            >
              <option value="">All Tags</option>
              {TAG_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="input-group" style={{ minWidth: 140, maxWidth: 200 }}>
            <label className="input-label">Bill Type</label>
            <input
              className="input-field"
              placeholder="e.g. Electricity"
              value={pendingFilters.billType}
              onChange={e => setPendingFilters(p => ({ ...p, billType: e.target.value }))}
              id="filter-billType"
              onKeyDown={e => { if (e.key === 'Enter') handleApplyFilters(); }}
              list="filter-bill-types"
            />
            <datalist id="filter-bill-types">
              {DEFAULT_BILL_TYPES.map(type => (
                <option key={type} value={type} />
              ))}
            </datalist>
          </div>

          <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-end', flexShrink: 0 }}>
            <button className="btn btn-primary btn-sm" onClick={handleApplyFilters} id="filter-apply-btn">
              <Search size={13} /> Apply
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleResetFilters} id="filter-reset-btn">
              <X size={13} /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* ── Data Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Table header bar */}
        <div style={{
          padding: '14px 20px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)',
        }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            Expense Records
            {totalElements > 0 && (
              <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8, fontSize: 13 }}>
                ({totalElements} total)
              </span>
            )}
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label className="input-label" style={{ margin: 0 }}>Per page:</label>
            <select
              className="input-field"
              style={{ width: 'auto', padding: '5px 8px', fontSize: 12 }}
              value={filters.size}
              onChange={e => setFilters(prev => ({ ...prev, size: Number(e.target.value), page: 0 }))}
              id="table-page-size"
            >
              {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Bill Type</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Tag</th>
                <th>Comment</th>
                <th>Slip</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, color: 'var(--text-muted)' }}>
                      <div className="spinner" />
                      Loading expenses…
                    </div>
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '56px 0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: 12,
                        background: 'var(--primary-light)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Receipt size={24} color="var(--primary)" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>No expenses found</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          Try adjusting your filters or create a new expense.
                        </div>
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={openCreate}>
                        <Plus size={13} /> Add Expense
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                expenses.map(exp => (
                  <tr key={exp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={13} color="var(--text-muted)" />
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{fmtDate(exp.date)}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{exp.billType}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(exp.amount)}
                      </span>
                    </td>
                    <td><TagBadge tag={exp.tag} /></td>
                    <td>
                      <span style={{
                        maxWidth: 180, display: 'inline-block', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        color: exp.comment ? 'var(--text-secondary)' : 'var(--text-muted)',
                      }}>
                        {exp.comment || '—'}
                      </span>
                    </td>
                    <td><SlipIndicator hasSlip={exp.hasSlip} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          title="View Details"
                          onClick={() => openDetail(exp)}
                          style={{ color: 'var(--primary)' }}
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Edit"
                          onClick={() => openEdit(exp)}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Delete"
                          onClick={() => openDelete(exp)}
                          style={{ color: 'var(--danger)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            padding: '12px 20px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', borderTop: '1px solid var(--border-color)',
          }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Page {filters.page + 1} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => goToPage(filters.page - 1)}
                disabled={filters.page === 0}
                id="pagination-prev"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let p = i;
                if (totalPages > 7) {
                  const start = Math.max(0, Math.min(filters.page - 3, totalPages - 7));
                  p = start + i;
                }
                return (
                  <button
                    key={p}
                    className={`btn btn-sm ${p === filters.page ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => goToPage(p)}
                  >
                    {p + 1}
                  </button>
                );
              })}
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => goToPage(filters.page + 1)}
                disabled={filters.page >= totalPages - 1}
                id="pagination-next"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals */}
      {modal === 'create' && (
        <ExpenseModal mode="create" initial={null} onClose={closeModal} onSaved={handleSaved} />
      )}
      {modal === 'edit' && selected && (
        <ExpenseModal mode="edit" initial={selected} onClose={closeModal} onSaved={handleSaved} />
      )}
      {modal === 'delete' && selected && (
        <DeleteModal expense={selected} onClose={closeModal} onDeleted={handleDeleted} />
      )}
      {modal === 'detail' && selected && (
        <DetailModal
          expense={selected}
          onClose={closeModal}
          onEdit={(exp) => { setSelected(exp); setModal('edit'); }}
          onDeleted={handleDeleted}
        />
      )}
      {modal?.export && (
        <ExportReportModal
          reportType={modal.export}
          filters={filters}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default ExpensePage;
