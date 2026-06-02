import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Plus, Search, ChevronLeft, ChevronRight,
  Edit2, Trash2, ToggleLeft, ToggleRight, Hash, Mail,
  Phone, MapPin, Eye, X, Check, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getAllClients, createClient, updateClient, deleteClient,
  toggleClientStatus, getNextClientId
} from '../../api/clients';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ active }) => (
  <span className={`badge ${active ? 'badge-success' : 'badge-danger'}`}>
    {active ? 'Active' : 'Inactive'}
  </span>
);

// ── Client Form Modal ─────────────────────────────────────────────────────────
const ClientFormModal = ({ client, onClose, onSaved }) => {
  const isEdit = !!client;
  const [nextId, setNextId] = useState('');
  const [form, setForm] = useState({
    name: client?.name || '',
    companyName: client?.companyName || '',
    contactEmail: client?.contactEmail || '',
    phone: client?.phone || '',
    address: client?.address || '',
    password: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isEdit) {
      getNextClientId().then(res => {
        setNextId(res?.data || res || '');
      }).catch(() => setNextId(''));
    }
  }, [isEdit]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.contactEmail.trim()) e.contactEmail = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) e.contactEmail = 'Invalid email format';
    if (!isEdit && !form.password) e.password = 'Password is required for new clients';
    if (form.password && form.password.length < 8) e.password = 'Password must be at least 8 characters';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (isEdit) {
        await updateClient(client.id, payload);
        toast.success('Client updated successfully');
      } else {
        await createClient(payload);
        toast.success('Client created successfully');
      }
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save client');
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
      <div className="modal-content animate-fade-in" style={{ width: '100%', maxWidth: '560px', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', margin: 0, color: 'var(--text-primary)' }}>{isEdit ? 'Edit Client' : 'Create New Client'}</h2>
            {!isEdit && nextId && <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Assigned ID: <strong>{nextId}</strong></p>}
          </div>
          <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input label="Full Name *" value={form.name} onChange={e => handleChange('name', e.target.value)} error={errors.name} placeholder="e.g. John Smith" />
            <Input label="Company Name" value={form.companyName} onChange={e => handleChange('companyName', e.target.value)} placeholder="e.g. Acme Corp" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input label="Contact Email *" type="email" value={form.contactEmail} onChange={e => handleChange('contactEmail', e.target.value)} error={errors.contactEmail} placeholder="email@company.com" />
            <Input label="Phone Number" value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+880" />
          </div>

          <Input label="Physical Address" value={form.address} onChange={e => handleChange('address', e.target.value)} placeholder="Street, City, Country" />

          <Input
            label={isEdit ? 'New Password (Optional)' : 'Account Password *'}
            type="password"
            value={form.password}
            onChange={e => handleChange('password', e.target.value)}
            error={errors.password}
            placeholder={isEdit ? 'Leave blank to keep current password' : 'Min. 8 characters'}
          />

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <div className="spinner" style={{ width: '16px', height: '16px' }} /> : <><Check size={16} /> {isEdit ? 'Save Changes' : 'Create Client'}</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
const DeleteModal = ({ client, onClose, onDeleted }) => {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteClient(client.id);
      toast.success('Client deleted');
      onDeleted();
    } catch {
      toast.error('Failed to delete client');
    } finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <AlertTriangle size={24} color="var(--danger)" />
        </div>
        <h3 style={{ margin: '0 0 8px' }}>Delete Client?</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 20px' }}>
          <strong>{client.name}</strong> and their user account will be permanently removed. This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={loading}>
            {loading ? 'Deleting…' : 'Delete Client'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const ClientList = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [meta, setMeta] = useState({ totalElements: 0, totalPages: 0, pageNumber: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [modal, setModal] = useState(null); // null | { type: 'create'|'edit'|'delete', client? }
  const [nextId, setNextId] = useState('');
  const PAGE_SIZE = 10;

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllClients(page, PAGE_SIZE);
      const data = res?.data || res;
      setClients(data?.content || []);
      setMeta({ totalElements: data?.totalElements || 0, totalPages: data?.totalPages || 0, pageNumber: data?.pageNumber || 0 });
    } catch {
      toast.error('Failed to load clients');
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleOpenCreate = () => {
    setModal({ type: 'create' });
  };

  const handleToggleStatus = async (client) => {
    const newActive = !client.active;
    try {
      await toggleClientStatus(client.id, newActive);
      toast.success(`Client ${newActive ? 'activated' : 'deactivated'}`);
      fetchClients();
    } catch { toast.error('Failed to update status'); }
  };

  const filtered = search
    ? clients.filter(c =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.contactEmail?.toLowerCase().includes(search.toLowerCase()) ||
      c.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      c.clientId?.toLowerCase().includes(search.toLowerCase())
    )
    : clients;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-light)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={20} color="var(--primary)" />
            </span>
            Clients
          </h1>
          <p>{meta.totalElements} client{meta.totalElements !== 1 ? 's' : ''} total</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> New Client
        </button>
      </div>

      {/* Search */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ position: 'relative', maxWidth: 360 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input-field"
            style={{ paddingLeft: 34, fontSize: 13 }}
            placeholder="Search by name, email, company or ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto', width: 28, height: 28 }} />
            <p style={{ color: 'var(--text-muted)', marginTop: 12, fontSize: 13 }}>Loading clients…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <Building2 size={40} color="var(--border-color)" style={{ marginBottom: 12 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              {search ? 'No clients match your search.' : 'No clients yet. Create one to get started.'}
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Client ID</th>
                <th>Name / Company</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'monospace', fontSize: 12, color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 8px', borderRadius: 6 }}>
                      <Hash size={11} />{c.clientId}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                        {c.name?.[0]?.toUpperCase() || 'C'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{c.name}</div>
                        {c.companyName && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.companyName}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}><Mail size={12} color="var(--text-muted)" />{c.contactEmail}</span>
                      {c.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}><Phone size={12} color="var(--text-muted)" />{c.phone}</span>}
                    </div>
                  </td>
                  <td>
                    {c.address
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}><MapPin size={12} color="var(--text-muted)" />{c.address}</span>
                      : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                    }
                  </td>
                  <td><StatusBadge active={c.active} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        title={c.active ? 'Deactivate' : 'Activate'}
                        onClick={() => handleToggleStatus(c)}
                        style={{ color: c.active ? 'var(--success)' : 'var(--danger)' }}
                      >
                        {c.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                      <button className="btn btn-ghost btn-sm" title="View Tickets" onClick={() => navigate('/support-tickets', { state: { clientId: c.id } })}>
                        <Eye size={15} />
                      </button>
                      <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => setModal({ type: 'edit', client: c })}>
                        <Edit2 size={15} />
                      </button>
                      <button className="btn btn-ghost btn-sm" title="Delete" style={{ color: 'var(--danger)' }} onClick={() => setModal({ type: 'delete', client: c })}>
                        <Trash2 size={15} />
                      </button>
                    </div>
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

      {/* Modals */}
      {modal?.type === 'create' && (
        <ClientFormModal nextId={nextId} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchClients(); }} />
      )}
      {modal?.type === 'edit' && (
        <ClientFormModal client={modal.client} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchClients(); }} />
      )}
      {modal?.type === 'delete' && (
        <DeleteModal client={modal.client} onClose={() => setModal(null)} onDeleted={() => { setModal(null); fetchClients(); }} />
      )}
    </div>
  );
};

export default ClientList;
