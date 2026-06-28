import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, Sparkles } from 'lucide-react';
import { getAllTickets, getMessages } from '../api/support';
import { useAuth } from '../context/AuthContext';

const formatTime = (dateStr) => {
  if (!dateStr) return 'just now';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const ClientNotificationBell = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const storageKey = useMemo(() => {
    const userId = user?.id || user?.email || 'anonymous';
    return `client-support-notifications-${userId}`;
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsSeen = (ticketId) => {
    try {
      const seen = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (!seen.includes(ticketId)) {
        localStorage.setItem(storageKey, JSON.stringify([...seen, ticketId]));
      }
    } catch {
      // ignore storage failures
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await getAllTickets({ page: 0, size: 50 });
      const tickets = res?.data?.content || res?.content || [];
      const seen = JSON.parse(localStorage.getItem(storageKey) || '[]');

      const unread = [];
      for (const ticket of tickets) {
        try {
          const msgRes = await getMessages(ticket.id);
          const messages = Array.isArray(msgRes?.data || msgRes) ? (msgRes?.data || msgRes) : [];
          const lastMessage = messages[messages.length - 1];

          const isSupportReply = Boolean(
            lastMessage &&
            lastMessage.senderRole &&
            !['ROLE_CLIENT', 'CLIENT'].includes(String(lastMessage.senderRole).toUpperCase())
          );

          if (isSupportReply && !seen.includes(ticket.id)) {
            unread.push({
              id: ticket.id,
              ticketNumber: ticket.ticketNumber,
              title: ticket.title || 'Support update',
              preview: lastMessage?.message || 'A new reply is available from the support team.',
              updatedAt: lastMessage?.createdAt || ticket.updatedAt || ticket.createdAt,
            });
          }
        } catch {
          // skip failed ticket fetches
        }
      }

      unread.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setNotifications(unread);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => fetchNotifications(), 15000);
    return () => clearInterval(interval);
  }, [storageKey]);

  const handleNotificationClick = (ticketId) => {
    markAsSeen(ticketId);
    setIsOpen(false);
    navigate(`/support-tickets/${ticketId}`);
  };

  const unreadCount = notifications.length;

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          background: isOpen ? 'var(--primary-light)' : 'transparent',
          border: '1px solid transparent',
          borderRadius: '999px',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: isOpen ? 'var(--primary)' : 'var(--text-secondary)',
          position: 'relative',
          transition: 'all 0.2s ease',
        }}
        title="Live support replies"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            minWidth: '16px',
            height: '16px',
            borderRadius: '999px',
            background: 'var(--danger)',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            border: '2px solid var(--bg-card)',
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '46px',
          right: 0,
          width: '360px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 120,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            borderBottom: '1px solid var(--border-color)',
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.06), rgba(14, 165, 233, 0.04))',
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Support replies</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Live updates from the support team</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontSize: '11px', fontWeight: 700 }}>
              <Sparkles size={13} />
              Live
            </div>
          </div>

          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                Checking for replies…
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                No new support replies right now.
              </div>
            ) : (
              notifications.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNotificationClick(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    width: '100%',
                    padding: '12px 14px',
                    border: 'none',
                    background: 'var(--bg-card)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-light)',
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: 'rgba(79, 70, 229, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                    flexShrink: 0,
                  }}>
                    <MessageSquare size={15} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '4px' }}>
                      {item.preview}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {item.ticketNumber} • {formatTime(item.updatedAt)}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientNotificationBell;
