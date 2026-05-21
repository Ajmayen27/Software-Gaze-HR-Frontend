import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Headset, Plus, Search, Filter, ChevronLeft, ChevronRight,
  Clock, AlertTriangle, CheckCircle2, XCircle, RotateCcw,
  Loader2, Tag, X, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllTickets, createTicket } from '../../api/support';
import { useAuth } from '../../context/AuthContext';

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  OPEN:               { label: 'Open',               color: '#0369A1', bg: '#F0F9FF', dot: '#0EA5E9' },
  IN_PROGRESS:        { label: 'In Progress',         color: '#7C3AED', bg: '#F5F3FF', dot: '#8B5CF6' },
  WAITING_FOR_CLIENT: { label: 'Waiting for Client',  color: '#B45309', bg: '#FFFBEB', dot: '#F59E0B' },
  RESOLVED:           { label: 'Resolved',            color: '#15803D', bg: '#F0FDF4', dot: '#22C55E' },
  CLOSED:             { label: 'Closed',              color: '#64748B', bg: '#F1F5F9', dot: '#94A3B8' },
  REOPENED:           { label: 'Reopened',            color: '#B91C1C', bg: '#FEF2F2', dot: '#EF4444' },
};

const PRIORITY_CONFIG = {
  LOW:      { label: 'Low',      color: '#64748B', bg: '#F1F5F9' },
  MEDIUM:   { label: 'Medium',   color: '#B45309', bg: '#FFFBEB' },
  HIGH:     { label: 'High',     color: '#C2410C', bg: '#FFF7ED' },
  CRITICAL: { label: 'Critical', color: '#B91C1C', bg: '#FEF2F2' },
};

const CATEGORIES = ['GENERAL', 'BILLING', 'TECHNICAL', 'BUG', 'FEATURE_REQUEST', 'OTHER'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const STATUSES   = ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CLIENT', 'RESOLVED', 'CLOSED', 'REOPENED'];

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#64748B', bg: '#F1F5F9', dot: '#94A3B8' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, letterSpacing: '0.3px' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  if (!priority) return null;
  const cfg = PRIORITY_CONFIG[priority] || { label: priority, color: '#64748B', bg: '#F1F5F9' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
      <AlertTriangle size={10} /> {cfg.label}
    </span>
  );
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ── Create Ticket Modal ───────────────────────────────────────────────────────
const CreateTicketModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ title: '', description: '', category: 'GENERAL', priority: 'MEDIUM' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.category) e.category = 'Category is required';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await createTicket(form);
      toast.success('Support ticket created!');
      onCreated();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create ticket');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, margin: 0 }}>New Support Ticket</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Describe your issue and our team will help you.</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="input-group">
            <label className="input-label">Title <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input className={`input-field ${errors.title ? 'input-error' : ''}`} value={form.title}
              onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(p => ({ ...p, title: '' })); }}
              placeholder="Brief summary of the issue…" />
            {errors.title && <span className="input-error-msg">{errors.title}</span>}
          </div>

          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea className="input-field" rows={4} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Provide details, steps to reproduce, screenshots links, etc."
              style={{ resize: 'vertical' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="input-label">Category <span style={{ color: 'var(--danger)' }}>*</span></label>
              <select className={`input-field ${errors.category ? 'input-error' : ''}`} value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Priority</label>
              <select className="input-field" value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Creating…</> : <><Check size={15} /> Submit Ticket</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const SupportTickets = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();
  const isClient = typeof role === 'string' && role.toUpperCase().includes('CLIENT');

  const [tickets, setTickets] = useState([]);
  const [meta, setMeta] = useState({ totalElements: 0, totalPages: 0, pageNumber: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const PAGE_SIZE = 10;

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: PAGE_SIZE };
      if (statusFilter) params.status = statusFilter;
      const res = await getAllTickets(params);
      const data = res?.data || res;
      setTickets(data?.content || []);
      setMeta({ totalElements: data?.totalElements || 0, totalPages: data?.totalPages || 0 });
    } catch {
      toast.error('Failed to load tickets');
    } finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const filtered = search
    ? tickets.filter(t =>
        t.title?.toLowerCase().includes(search.toLowerCase()) ||
        t.ticketNumber?.toLowerCase().includes(search.toLowerCase()) ||
        t.client?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : tickets;

  // Counts per status for tabs
  const countByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = tickets.filter(t => t.status === s).length;
    return acc;
  }, {});

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-light)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Headset size={20} color="var(--primary)" />
            </span>
            Support Tickets
          </h1>
          <p>{meta.totalElements} ticket{meta.totalElements !== 1 ? 's' : ''} {!isClient ? 'across all clients' : ''}</p>
        </div>
        {isClient && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New Ticket
          </button>
        )}
      </div>

      {/* Status Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          className={`btn btn-sm ${statusFilter === '' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setStatusFilter(''); setPage(0); }}
        >
          All <span style={{ opacity: 0.7, marginLeft: 4 }}>{meta.totalElements}</span>
        </button>
        {STATUSES.map(s => {
          const cfg = STATUS_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(0); }}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', border: '1px solid',
                background: statusFilter === s ? cfg.bg : 'var(--bg-card)',
                color: statusFilter === s ? cfg.color : 'var(--text-secondary)',
                borderColor: statusFilter === s ? cfg.dot : 'var(--border-color)',
                transition: 'all 0.15s'
              }}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ position: 'relative', maxWidth: 380 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input-field"
            style={{ paddingLeft: 34, fontSize: 13 }}
            placeholder="Search by title, ticket number or client…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tickets Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto', width: 28, height: 28 }} />
            <p style={{ color: 'var(--text-muted)', marginTop: 12, fontSize: 13 }}>Loading tickets…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <Headset size={40} color="var(--border-color)" style={{ marginBottom: 12 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              {search || statusFilter ? 'No tickets match your filters.' : isClient ? 'No tickets yet. Create one to get started.' : 'No tickets found.'}
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket</th>
                {!isClient && <th>Client</th>}
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} onClick={() => navigate(`/support-tickets/${t.id}`)}
                  style={{ cursor: 'pointer' }}>
                  <td>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13, marginBottom: 2 }}>{t.title}</div>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--primary)', background: 'var(--primary-light)', padding: '1px 6px', borderRadius: 4 }}>
                        {t.ticketNumber}
                      </span>
                    </div>
                  </td>
                  {!isClient && (
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{t.client?.name || '—'}</div>
                      {t.client?.companyName && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.client.companyName}</div>}
                    </td>
                  )}
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                      <Tag size={12} /> {t.category?.replace('_', ' ')}
                    </span>
                  </td>
                  <td><PriorityBadge priority={t.priority} /></td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>
                    {t.assignedTo
                      ? <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.assignedTo.email}</span>
                      : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Unassigned</span>
                    }
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {timeAgo(t.createdAt)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--border-light)', fontSize: 13, color: 'var(--text-muted)' }}>
            <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, meta.totalElements)} of {meta.totalElements}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-secondary btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></button>
              <button className="btn btn-secondary btn-sm" disabled={page >= meta.totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <CreateTicketModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchTickets(); }} />
      )}
    </div>
  );
};

export default SupportTickets;
