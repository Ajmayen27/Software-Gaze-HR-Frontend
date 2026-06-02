import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Send, UserCircle2, Shield, Clock, Tag, AlertTriangle,
  CheckCircle2, XCircle, RotateCcw, UserCheck, X, Check, MessageSquare, Image
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getTicketById, getMessages, uploadMessageAttachments,
  assignTicket, resolveTicket, closeTicket, reopenTicket
} from '../../api/support';
import { useAuth } from '../../context/AuthContext';
import { Client } from '@stomp/stompjs';
import { axiosInstance } from '../../api/axiosInstance';

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  OPEN:               { label: 'Open',              color: '#0369A1', bg: '#F0F9FF', dot: '#0EA5E9' },
  IN_PROGRESS:        { label: 'In Progress',        color: '#7C3AED', bg: '#F5F3FF', dot: '#8B5CF6' },
  WAITING_FOR_CLIENT: { label: 'Waiting for Client', color: '#B45309', bg: '#FFFBEB', dot: '#F59E0B' },
  RESOLVED:           { label: 'Resolved',           color: '#15803D', bg: '#F0FDF4', dot: '#22C55E' },
  CLOSED:             { label: 'Closed',             color: '#64748B', bg: '#F1F5F9', dot: '#94A3B8' },
  REOPENED:           { label: 'Reopened',           color: '#B91C1C', bg: '#FEF2F2', dot: '#EF4444' },
};

const PRIORITY_CONFIG = {
  LOW:      { color: '#64748B', bg: '#F1F5F9' },
  MEDIUM:   { color: '#B45309', bg: '#FFFBEB' },
  HIGH:     { color: '#C2410C', bg: '#FFF7ED' },
  CRITICAL: { color: '#B91C1C', bg: '#FEF2F2' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#64748B', bg: '#F1F5F9', dot: '#94A3B8' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: cfg.bg, color: cfg.color }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot }} />
      {cfg.label}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  if (!priority) return null;
  const cfg = PRIORITY_CONFIG[priority] || { color: '#64748B', bg: '#F1F5F9' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
      <AlertTriangle size={11} /> {priority}
    </span>
  );
};

const formatTime = (dt) => {
  if (!dt) return '';
  return new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ── Assign Modal ──────────────────────────────────────────────────────────────
const AssignModal = ({ onClose, onDone }) => {
  const [form, setForm] = useState({ assignedToId: '', priority: 'MEDIUM' });
  const [saving, setSaving] = useState(false);
  const { id } = useParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { priority: form.priority };
      if (form.assignedToId) payload.assignedToId = Number(form.assignedToId);
      await assignTicket(id, payload);
      toast.success('Ticket assigned and set to In Progress');
      onDone();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to assign ticket');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, margin: 0 }}>Assign Ticket</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="input-group">
            <label className="input-label">Assignee User ID</label>
            <input className="input-field" type="number" placeholder="Enter user ID (optional)"
              value={form.assignedToId} onChange={e => setForm(f => ({ ...f, assignedToId: e.target.value }))} />
          </div>
          <div className="input-group">
            <label className="input-label">Priority</label>
            <select className="input-field" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Assigning…' : <><UserCheck size={15} /> Assign & Start</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Resolve Modal ─────────────────────────────────────────────────────────────
const ResolveModal = ({ onClose, onDone }) => {
  const [form, setForm] = useState({ resolutionNote: '', tags: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { id } = useParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.resolutionNote.trim()) { setError('Resolution note is required'); return; }
    setSaving(true);
    try {
      await resolveTicket(id, form);
      toast.success('Ticket resolved and client notified');
      onDone();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to resolve ticket');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, margin: 0 }}>Resolve Ticket</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="input-group">
            <label className="input-label">Resolution Note <span style={{ color: 'var(--danger)' }}>*</span></label>
            <textarea className={`input-field ${error ? 'input-error' : ''}`} rows={4} style={{ resize: 'vertical' }}
              value={form.resolutionNote} onChange={e => { setForm(f => ({ ...f, resolutionNote: e.target.value })); setError(''); }}
              placeholder="Describe how the issue was resolved…" />
            {error && <span className="input-error-msg">{error}</span>}
          </div>
          <div className="input-group">
            <label className="input-label">Tags <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <input className="input-field" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="e.g. billing, resolved-by-email" />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-success" disabled={saving}>
              {saving ? 'Resolving…' : <><CheckCircle2 size={15} /> Mark Resolved</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Authenticated Attachment ──────────────────────────────────────────────────
const AuthenticatedAttachment = ({ attachment, onClick }) => {
  const [imgUrl, setImgUrl] = useState(null);

  useEffect(() => {
    let objUrl;
    const fetchBlob = async () => {
      try {
        const absoluteUrl = attachment.downloadUrl.startsWith('http') 
          ? attachment.downloadUrl 
          : `http://localhost:8081${attachment.downloadUrl}`;
        const res = await axiosInstance.get(absoluteUrl, { responseType: 'blob' });
        // axiosInstance interceptor unwraps response.data, so res is the Blob
        objUrl = URL.createObjectURL(res);
        setImgUrl(objUrl);
      } catch (e) {
        console.error('Failed to load attachment', e);
      }
    };
    fetchBlob();
    return () => { if (objUrl) URL.revokeObjectURL(objUrl); };
  }, [attachment.downloadUrl]);

  return (
    <div onClick={() => { if (imgUrl) onClick(imgUrl); }} title="Click to view"
       style={{ display: 'block', overflow: 'hidden', borderRadius: 4, border: '1px solid rgba(0,0,0,0.1)', background: '#fff', cursor: imgUrl ? 'pointer' : 'default' }}>
      {imgUrl ? (
        <img src={imgUrl} alt={attachment.fileName} style={{ width: 80, height: 80, objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.05)' }}>
          <span className="spinner" style={{ width: 20, height: 20 }} />
        </div>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const isClient   = typeof role === 'string' && role.toUpperCase().includes('CLIENT');
  const isAdmin    = typeof role === 'string' && (role.toUpperCase().includes('ADMIN') || role.toUpperCase().includes('MANAGER'));
  const bottomRef  = useRef(null);

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msgText, setMsgText] = useState('');
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [modal, setModal] = useState(null); // 'assign' | 'resolve'
  const [lightboxImg, setLightboxImg] = useState(null);
  const [actionLoading, setActionLoading] = useState('');
  const stompClientRef = useRef(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, mRes] = await Promise.all([getTicketById(id), getMessages(id)]);
      setTicket(tRes?.data || tRes);
      const rawMsgs = Array.isArray(mRes?.data || mRes) ? (mRes?.data || mRes) : [];
      // Sort ascending by ID to ensure newest messages appear at the bottom
      const sortedMsgs = [...rawMsgs].sort((a, b) => a.id - b.id);
      setMessages(sortedMsgs);
    } catch {
      toast.error('Failed to load ticket');
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Establish WebSocket Connection
  useEffect(() => {
    if (!id) return;
    
    const token = sessionStorage.getItem('accessToken');
    const client = new Client({
      brokerURL: `ws://localhost:8081/api/v1/ws?token=${token}`,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('Connected to WebSocket');
        client.subscribe(`/topic/support-tickets/${id}/messages`, function (message) {
          if (message.body) {
            const newMsg = JSON.parse(message.body);
            setMessages(prev => {
              // Prevent duplicate if sent via REST and also received via WS
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      }
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (client.active) {
        client.deactivate();
      }
    };
  }, [id]);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgText.trim() && files.length === 0) return;
    setSending(true);
    try {
      let attachmentIds = [];
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        const uploadRes = await uploadMessageAttachments(id, formData);
        
        // Handle unwrapped array or standard axios response gracefully
        let uploadedData = [];
        if (Array.isArray(uploadRes)) {
          uploadedData = uploadRes;
        } else if (Array.isArray(uploadRes?.data)) {
          uploadedData = uploadRes.data;
        } else if (Array.isArray(uploadRes?.data?.data)) {
          uploadedData = uploadRes.data.data;
        }
        
        attachmentIds = uploadedData.map(att => att.id);
      }
      
      const payload = {};
      if (msgText.trim()) payload.message = msgText.trim();
      if (attachmentIds.length > 0) payload.attachmentIds = attachmentIds;

      if (stompClientRef.current && stompClientRef.current.active) {
        stompClientRef.current.publish({
          destination: `/app/support-tickets/${id}/messages`,
          body: JSON.stringify(payload)
        });
      } else {
        toast.error('Not connected to live chat. Please refresh.');
      }

      setMsgText('');
      setFiles([]);
    } catch {
      toast.error('Failed to send message');
    } finally { setSending(false); }
  };

  const handleAction = async (action) => {
    setActionLoading(action);
    try {
      if (action === 'close')  await closeTicket(id);
      if (action === 'reopen') await reopenTicket(id);
      toast.success(`Ticket ${action === 'close' ? 'closed' : 'reopened'}`);
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || `Failed to ${action} ticket`);
    } finally { setActionLoading(''); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  if (!ticket) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <p style={{ color: 'var(--text-muted)' }}>Ticket not found.</p>
      <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/support-tickets')}>← Back</button>
    </div>
  );

  const canClose  = isClient && ['RESOLVED'].includes(ticket.status);
  const canReopen = isClient && ['RESOLVED', 'CLOSED'].includes(ticket.status);
  const canAssign = isAdmin  && ['OPEN', 'REOPENED'].includes(ticket.status);
  const canResolve= isAdmin  && ['IN_PROGRESS', 'WAITING_FOR_CLIENT', 'REOPENED'].includes(ticket.status);

  return (
    <div className="animate-fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Back */}
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate('/support-tickets')}>
        <ArrowLeft size={15} /> Back to Tickets
      </button>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

        {/* LEFT: Messages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Ticket Title Card */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
              <div>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 8px', borderRadius: 4, display: 'inline-block', marginBottom: 8 }}>
                  {ticket.ticketNumber}
                </span>
                <h1 style={{ fontSize: 20, margin: 0 }}>{ticket.title}</h1>
              </div>
              <StatusBadge status={ticket.status} />
            </div>
            {ticket.description && (
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, margin: 0, padding: '12px 0', borderTop: '1px solid var(--border-light)' }}>
                {ticket.description}
              </p>
            )}
            {ticket.resolutionNote && (
              <div style={{ marginTop: 12, padding: '12px 14px', background: 'var(--success-light)', borderRadius: 8, borderLeft: '3px solid var(--success)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>Resolution Note</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{ticket.resolutionNote}</div>
              </div>
            )}
            {ticket.tags && (
              <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ticket.tags.split(',').map((t, i) => (
                  <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 600 }}>
                    <Tag size={10} style={{ verticalAlign: 'middle', marginRight: 2 }} />{t.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Messages Thread */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={16} color="var(--primary)" />
              <span style={{ fontWeight: 600, fontSize: 14 }}>Conversation</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
            </div>

            <div style={{ maxHeight: 420, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  No messages yet. Start the conversation below.
                </div>
              ) : (
                messages.map(msg => {
                  const isAdminMsg = msg.senderRole === 'ROLE_ADMIN' || msg.senderRole === 'ROLE_MANAGER';
                  // Label: admin viewers see client name; client viewers see "You" for their own messages
                  const senderLabel = isAdminMsg
                    ? 'Support Team'
                    : isClient
                      ? 'You'
                      : (ticket.client?.name || 'Client');
                  return (
                    <div key={msg.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: isAdminMsg ? 'row' : 'row-reverse' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isAdminMsg ? 'var(--primary-light)' : 'var(--success-light)' }}>
                        {isAdminMsg ? <Shield size={15} color="var(--primary)" /> : <UserCircle2 size={15} color="var(--success)" />}
                      </div>
                      <div style={{ maxWidth: '75%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexDirection: isAdminMsg ? 'row' : 'row-reverse' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: isAdminMsg ? 'var(--primary)' : 'var(--success)' }}>
                            {senderLabel}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatTime(msg.createdAt)}</span>
                        </div>
                        <div style={{
                          padding: '10px 14px', borderRadius: isAdminMsg ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
                          background: isAdminMsg ? 'var(--bg-body)' : 'var(--primary)',
                          color: isAdminMsg ? 'var(--text-primary)' : '#fff',
                          fontSize: 13, lineHeight: 1.5, border: isAdminMsg ? '1px solid var(--border-light)' : 'none'
                        }}>
                          {msg.message && <div style={{ marginBottom: msg.attachments?.length ? 8 : 0 }}>{msg.message}</div>}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {msg.attachments.map(att => (
                                <AuthenticatedAttachment key={att.id} attachment={att} onClick={setLightboxImg} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Message Input */}
            {!['CLOSED'].includes(ticket.status) && (
              <div style={{ borderTop: '1px solid var(--border-light)', padding: '14px 18px' }}>
                <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <label className="btn btn-ghost" style={{ padding: '9px 12px', cursor: 'pointer', alignSelf: 'flex-end', marginBottom: 2 }}>
                      <Image size={18} color="var(--text-secondary)" />
                      <input type="file" multiple accept="image/jpeg, image/png, image/webp" style={{ display: 'none' }}
                        onChange={e => {
                          const newFiles = Array.from(e.target.files);
                          if (files.length + newFiles.length > 3) { toast.error('Max 3 pictures allowed'); return; }
                          const valid = newFiles.filter(f => f.size <= 5 * 1024 * 1024);
                          if (valid.length < newFiles.length) toast.error('Some files exceed 5MB limit');
                          setFiles(prev => [...prev, ...valid].slice(0, 3));
                          e.target.value = '';
                        }} />
                    </label>
                    <textarea
                      className="input-field"
                      rows={2}
                      style={{ resize: 'none', flex: 1, fontSize: 13 }}
                      placeholder="Type your message…"
                      value={msgText}
                      onChange={e => setMsgText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                    />
                    <button type="submit" className="btn btn-primary" disabled={sending || (!msgText.trim() && files.length === 0)} style={{ alignSelf: 'flex-end', padding: '9px 14px' }}>
                      {sending ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Send size={16} />}
                    </button>
                  </div>
                  
                  {files.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, paddingLeft: 46 }}>
                      {files.map((file, i) => (
                        <div key={i} style={{ position: 'relative', width: 50, height: 50 }}>
                          <img src={URL.createObjectURL(file)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-light)' }} />
                          <button type="button" onClick={() => setFiles(f => f.filter((_, idx) => idx !== i))}
                            style={{ position: 'absolute', top: -6, right: -6, background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </form>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, paddingLeft: 46 }}>Press Enter to send, Shift+Enter for new line. Max 3 pictures (5MB each).</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Info Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Actions */}
          {(canAssign || canResolve || canClose || canReopen) && (
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', fontSize: 11 }}>Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {canAssign && (
                  <button className="btn btn-primary btn-sm" style={{ justifyContent: 'flex-start' }} onClick={() => setModal('assign')}>
                    <UserCheck size={15} /> Assign Ticket
                  </button>
                )}
                {canResolve && (
                  <button className="btn btn-success btn-sm" style={{ justifyContent: 'flex-start' }} onClick={() => setModal('resolve')}>
                    <CheckCircle2 size={15} /> Mark Resolved
                  </button>
                )}
                {canClose && (
                  <button className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }} disabled={actionLoading === 'close'} onClick={() => handleAction('close')}>
                    {actionLoading === 'close' ? <span className="spinner" style={{ width: 13, height: 13 }} /> : <XCircle size={15} />} Close Ticket
                  </button>
                )}
                {canReopen && (
                  <button className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start', color: 'var(--warning)' }} disabled={actionLoading === 'reopen'} onClick={() => handleAction('reopen')}>
                    {actionLoading === 'reopen' ? <span className="spinner" style={{ width: 13, height: 13 }} /> : <RotateCcw size={15} />} Reopen Ticket
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Details */}
          <div className="card">
            <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 14, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Details</div>
            {[
              { label: 'Status', value: <StatusBadge status={ticket.status} /> },
              { label: 'Priority', value: <PriorityBadge priority={ticket.priority} /> || '—' },
              { label: 'Category', value: ticket.category?.replace('_', ' ') || '—' },
              { label: 'Client', value: ticket.client?.name || '—' },
              { label: 'Company', value: ticket.client?.companyName || '—' },
              { label: 'Assigned To', value: ticket.assignedTo?.email || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span> },
              { label: 'Created', value: formatTime(ticket.createdAt) },
              { label: 'Last Updated', value: formatTime(ticket.updatedAt) },
              { label: 'Closed At', value: ticket.closedAt ? formatTime(ticket.closedAt) : '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid var(--border-light)', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, textAlign: 'right' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal === 'assign' && <AssignModal onClose={() => setModal(null)} onDone={() => { setModal(null); fetchAll(); }} />}
      {modal === 'resolve' && <ResolveModal onClose={() => setModal(null)} onDone={() => { setModal(null); fetchAll(); }} />}
      
      {/* Lightbox */}
      {lightboxImg && (
        <div className="modal-overlay" onClick={() => setLightboxImg(null)} style={{ zIndex: 9999, padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <button onClick={() => setLightboxImg(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }} 
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} 
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
            <X size={24} />
          </button>
          <img src={lightboxImg} alt="Full screen preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default TicketDetail;
