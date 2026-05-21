import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, RefreshCw, Check, ArrowRight, User, AlertTriangle, ExternalLink } from 'lucide-react';
import { getAllTickets, getMessages, assignTicket } from '../api/support';
import toast from 'react-hot-toast';

// Relative time helper
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

// Priority badge colors helper
const getPriorityStyles = (priority) => {
  switch (priority) {
    case 'CRITICAL':
      return { bg: 'rgba(220, 38, 38, 0.12)', color: '#DC2626' };
    case 'HIGH':
      return { bg: 'rgba(249, 115, 22, 0.12)', color: '#EA580C' };
    case 'MEDIUM':
      return { bg: 'rgba(245, 158, 11, 0.12)', color: '#D97706' };
    default:
      return { bg: 'rgba(100, 116, 139, 0.12)', color: '#475569' };
  }
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const dropdownRef = useRef(null);

  // Core detection logic for unanswered/unopened client messages
  const fetchNotifications = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    
    try {
      // Fetch latest 50 tickets
      const res = await getAllTickets({ page: 0, size: 50 });
      const tickets = res?.data?.content || res?.content || [];

      // Filter active tickets that might require response
      const activeTickets = tickets.filter(t => 
        ['OPEN', 'REOPENED', 'IN_PROGRESS'].includes(t.status)
      );

      const list = [];

      // Process in parallel
      await Promise.all(activeTickets.map(async (t) => {
        try {
          const mRes = await getMessages(t.id);
          const msgs = Array.isArray(mRes?.data || mRes) ? (mRes?.data || mRes) : [];

          let needsResponse = false;
          let lastMsg = null;

          if (t.status === 'OPEN' || t.status === 'REOPENED') {
            // OPEN or REOPENED tickets are considered new/unopened client messages
            needsResponse = true;
            if (msgs.length > 0) {
              lastMsg = msgs[msgs.length - 1];
            }
          } else if (t.status === 'IN_PROGRESS') {
            // IN_PROGRESS tickets only need attention if the client sent the last message
            if (msgs.length > 0) {
              lastMsg = msgs[msgs.length - 1];
              const isLastMsgAdmin = lastMsg.senderRole === 'ROLE_ADMIN' || lastMsg.senderRole === 'ROLE_MANAGER';
              if (!isLastMsgAdmin) {
                needsResponse = true;
              }
            } else {
              // IN_PROGRESS with no messages yet (just assigned, client hasn't spoken)
              needsResponse = false;
            }
          }

          if (needsResponse) {
            list.push({
              id: t.id,
              ticketNumber: t.ticketNumber,
              title: t.title,
              clientName: t.client?.name || t.clientName || 'Unknown Client',
              companyName: t.client?.companyName || 'No Company',
              priority: t.priority,
              status: t.status,
              lastMessage: lastMsg ? lastMsg.message : t.description || 'No message content',
              lastMessageTime: lastMsg ? lastMsg.createdAt : t.createdAt,
              lastSender: lastMsg ? (lastMsg.senderRole === 'ROLE_CLIENT' ? 'Client' : 'User') : 'Client'
            });
          }
        } catch (err) {
          console.error(`Failed to fetch messages for ticket ${t.id}`, err);
          // Fallback if message fetch fails: OPEN/REOPENED need attention anyway
          if (t.status === 'OPEN' || t.status === 'REOPENED') {
            list.push({
              id: t.id,
              ticketNumber: t.ticketNumber,
              title: t.title,
              clientName: t.client?.name || t.clientName || 'Client',
              priority: t.priority,
              status: t.status,
              lastMessage: t.description || 'No description',
              lastMessageTime: t.createdAt,
              lastSender: 'Client'
            });
          }
        }
      }));

      // Sort notifications by last message/creation time descending
      list.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
      setNotifications(list);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Poll for notifications every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickAcknowledge = async (e, id, priority) => {
    e.stopPropagation(); // Stop routing navigate
    try {
      await assignTicket(id, { priority });
      toast.success('Ticket acknowledged & in progress');
      fetchNotifications(true);
    } catch {
      toast.error('Failed to acknowledge ticket');
    }
  };

  const handleNotificationClick = (id) => {
    setIsOpen(false);
    navigate(`/support-tickets/${id}`);
  };

  const count = notifications.length;

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isOpen ? 'var(--primary)' : 'var(--text-secondary)',
          position: 'relative',
          transition: 'all 0.2s ease',
          backgroundColor: isOpen ? 'var(--primary-light)' : 'transparent',
        }}
        onMouseOver={e => {
          if (!isOpen) e.currentTarget.style.backgroundColor = 'var(--bg-body)';
        }}
        onMouseOut={e => {
          if (!isOpen) e.currentTarget.style.backgroundColor = 'transparent';
        }}
        title="Client messages notifications"
      >
        <Bell size={20} style={{ transform: count > 0 && !isOpen ? 'rotate(10deg)' : 'none' }} />
        {count > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              minWidth: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: 'var(--danger)',
              color: '#fff',
              fontSize: '10px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid var(--bg-header)',
              boxShadow: '0 0 0 1px rgba(220, 38, 38, 0.2)',
              animation: 'pulse 2s infinite'
            }}
          >
            {count}
          </span>
        )}
      </button>

      {/* Pulsing effect styles */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '46px',
            right: '0',
            width: '380px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 100,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'dropdownOpen 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            transformOrigin: 'top right',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Dropdown Animation Style */}
          <style>{`
            @keyframes dropdownOpen {
              from { opacity: 0; transform: scale(0.95) translateY(-5px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>

          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--primary-light)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={16} color="var(--primary)" />
              <span style={{ fontWeight: '600', color: 'var(--primary)', fontSize: '14px' }}>
                Client Messages Need Response
              </span>
              {count > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: '#fff',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                  }}
                >
                  {count} new
                </span>
              )}
            </div>
            <button
              onClick={() => fetchNotifications(true)}
              disabled={refreshing}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '4px',
                transition: 'all 0.2s',
              }}
              title="Refresh notifications"
            >
              <RefreshCw
                size={14}
                style={{
                  animation: refreshing ? 'spin 1s linear infinite' : 'none'
                }}
              />
            </button>
          </div>

          {/* Notifications List */}
          <div
            style={{
              maxHeight: '340px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {loading ? (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto', width: '24px', height: '24px' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '10px' }}>
                  Loading active tickets...
                </span>
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--success-light)',
                    color: 'var(--success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}
                >
                  <Check size={20} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', display: 'block' }}>
                  All caught up!
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  No unopened tickets or unanswered client messages.
                </span>
              </div>
            ) : (
              notifications.map((n) => {
                const prio = getPriorityStyles(n.priority);
                const isNewTicket = n.status === 'OPEN' || n.status === 'REOPENED';
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n.id)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-light)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      position: 'relative'
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-body)'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* Unread indicator dot */}
                    <span
                      style={{
                        position: 'absolute',
                        left: '6px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: isNewTicket ? 'var(--danger)' : 'var(--warning)'
                      }}
                      title={isNewTicket ? 'New / Unopened Ticket' : 'New Client Message'}
                    />

                    {/* Ticket Header (Ticket Number & Client) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          color: 'var(--primary)',
                          background: 'var(--primary-light)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}
                      >
                        {n.ticketNumber}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: prio.bg,
                          color: prio.color,
                          fontWeight: '700',
                          letterSpacing: '0.3px'
                        }}
                      >
                        {n.priority}
                      </span>
                    </div>

                    {/* Client & Ticket Subject */}
                    <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {n.title}
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontWeight: '500' }}>{n.clientName}</span>
                      <span style={{ color: 'var(--text-muted)' }}>({n.companyName})</span>
                    </div>

                    {/* Message Preview */}
                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        margin: '2px 0 4px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        backgroundColor: 'var(--bg-body)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        borderLeft: isNewTicket ? '2px solid var(--danger)' : '2px solid var(--warning)'
                      }}
                    >
                      {n.lastMessage}
                    </p>

                    {/* Footer (Time & Quick Actions) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {timeAgo(n.lastMessageTime)}
                      </span>

                      {/* Quick acknowledge action if ticket is OPEN/REOPENED */}
                      {isNewTicket ? (
                        <button
                          onClick={(e) => handleQuickAcknowledge(e, n.id, n.priority)}
                          style={{
                            background: 'none',
                            border: '1px solid var(--border-color)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s',
                          }}
                          onMouseOver={e => {
                            e.currentTarget.style.backgroundColor = 'var(--primary)';
                            e.currentTarget.style.color = '#fff';
                            e.currentTarget.style.borderColor = 'var(--primary)';
                          }}
                          onMouseOut={e => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                          }}
                          title="Move to In Progress"
                        >
                          Acknowledge
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--warning)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          Reply needed <ExternalLink size={10} />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer View All Link */}
          <div
            onClick={() => {
              setIsOpen(false);
              navigate('/support-tickets');
            }}
            style={{
              padding: '12px',
              textAlign: 'center',
              borderTop: '1px solid var(--border-light)',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'background 0.15s ease',
              backgroundColor: 'var(--bg-body)'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--primary-light)'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--bg-body)'}
          >
            <span>Go to Support Board</span>
            <ArrowRight size={14} />
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
