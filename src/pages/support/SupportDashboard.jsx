import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Headset, Users, AlertCircle, CheckCircle2, Inbox, TrendingUp, Shield, BarChart2, Plus, ArrowRight, Building } from 'lucide-react';
import { getAllTickets } from '../../api/support';
import { getAllClients } from '../../api/clients';
import Button from '../../components/ui/Button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import toast from 'react-hot-toast';

const SupportDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    totalClients: 0
  });

  const [ticketStatusData, setTicketStatusData] = useState([]);
  const [ticketPriorityData, setTicketPriorityData] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [recentClients, setRecentClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [ticketsRes, clientsRes] = await Promise.all([
          getAllTickets({ size: 100 }),
          getAllClients(0, 100)
        ]);

        const tickets = ticketsRes?.data?.content || ticketsRes?.content || [];
        const clients = clientsRes?.data?.content || clientsRes?.content || [];

        // Statistics computation
        const totalTickets = tickets.length;
        const openTickets = tickets.filter(t => t.status === 'OPEN' || t.status === 'REOPENED').length;
        const inProgressTickets = tickets.filter(t => t.status === 'IN_PROGRESS' || t.status === 'WAITING_FOR_CLIENT').length;
        const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
        const totalClients = clientsRes?.data?.totalElements || clients.length;

        setStats({
          totalTickets,
          openTickets,
          inProgressTickets,
          resolvedTickets,
          totalClients
        });

        // Recharts: Ticket Status Count
        const statusCounts = { 'OPEN': 0, 'IN_PROGRESS': 0, 'WAITING_FOR_CLIENT': 0, 'RESOLVED': 0, 'CLOSED': 0, 'REOPENED': 0 };
        tickets.forEach(t => {
          if (statusCounts[t.status] !== undefined) {
            statusCounts[t.status]++;
          }
        });
        const statusChartData = Object.keys(statusCounts)
          .map(status => ({
            name: status.replaceAll('_', ' '),
            value: statusCounts[status]
          }))
          .filter(item => item.value > 0);

        // Recharts: Ticket Priority Count
        const priorityCounts = { 'LOW': 0, 'MEDIUM': 0, 'HIGH': 0, 'CRITICAL': 0 };
        tickets.forEach(t => {
          if (t.priority && priorityCounts[t.priority] !== undefined) {
            priorityCounts[t.priority]++;
          }
        });
        const priorityChartData = Object.keys(priorityCounts).map(p => ({
          name: p,
          count: priorityCounts[p]
        }));

        setTicketStatusData(statusChartData);
        setTicketPriorityData(priorityChartData);
        setRecentTickets(tickets.slice(0, 5));
        setRecentClients(clients.slice(0, 5));
      } catch (err) {
        toast.error('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ icon: Icon, label, value, color, bg }) => (
    <div className="stat-card" style={{ transition: 'transform 0.2s', cursor: 'pointer' }}
      onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
      <div className="stat-icon" style={{ background: bg, color }}>
        <Icon size={22} />
      </div>
      <div>
        <div className="stat-value" style={{ fontSize: '24px', fontWeight: '700' }}>{loading ? '—' : value}</div>
        <div className="stat-label" style={{ fontSize: '13px', fontWeight: '500' }}>{label}</div>
      </div>
    </div>
  );

  const COLORS = ['#ef4444', '#7c3aed', '#f59e0b', '#10b981', '#6b7280', '#b91c1c'];
  const STATUS_COLORS = {
    'OPEN': '#0ea5e9',
    'IN PROGRESS': '#8b5cf6',
    'WAITING FOR CLIENT': '#f59e0b',
    'RESOLVED': '#10b981',
    'CLOSED': '#6b7280',
    'REOPENED': '#ef4444'
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '30px' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '0' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-light)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Headset size={20} color="var(--primary)" />
            </span>
            Support Dashboard
          </h1>
          <p>Real-time analytics and management of support tickets</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button className="btn-primary" onClick={() => navigate('/support/tickets')}>
            <Plus size={14} /> View All Tickets
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard icon={Inbox} label="Total Tickets" value={stats.totalTickets} color="#3b82f6" bg="rgba(59, 130, 246, 0.15)" />
        <StatCard icon={AlertCircle} label="Open & Reopened" value={stats.openTickets} color="#ef4444" bg="rgba(239, 68, 68, 0.15)" />
        <StatCard icon={TrendingUp} label="In Progress" value={stats.inProgressTickets} color="#f59e0b" bg="rgba(245, 158, 11, 0.15)" />
        <StatCard icon={CheckCircle2} label="Resolved / Closed" value={stats.resolvedTickets} color="#10b981" bg="rgba(16, 185, 129, 0.15)" />
        <StatCard icon={Users} label="Total Clients" value={stats.totalClients} color="#8b5cf6" bg="rgba(139, 92, 246, 0.15)" />
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
        {/* Ticket Status Chart */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <BarChart2 size={16} color="var(--primary)" /> Tickets by Status
          </h3>
          <div style={{ height: '250px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {loading ? (
              <div className="spinner" />
            ) : ticketStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ticketStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                    {ticketStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>No ticket data available</div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '10px', flexWrap: 'wrap' }}>
            {ticketStatusData.map((entry, index) => (
              <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: STATUS_COLORS[entry.name] || COLORS[index % COLORS.length] }} />
                <span style={{ color: 'var(--text-secondary)' }}>{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ticket Priority Distribution */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield size={16} color="var(--primary)" /> Tickets by Priority
          </h3>
          <div style={{ height: '260px', width: '100%' }}>
            {loading ? (
              <div className="spinner" style={{ margin: '100px auto' }} />
            ) : ticketPriorityData.some(p => p.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ticketPriorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} allowDecimals={false} />
                  <RechartsTooltip cursor={{ fill: 'var(--bg-hover)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Lists Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Recent Tickets */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', margin: 0 }}>Recent Tickets</h3>
            <Button variant="ghost" onClick={() => navigate('/support/tickets')} style={{ fontSize: '12px', padding: '4px 10px' }}>
              View All <ArrowRight size={12} />
            </Button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '32px' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
              ) : recentTickets.length === 0 ? (
                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No tickets found.</td></tr>
              ) : (
                recentTickets.map(t => (
                  <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/support/tickets/${t.id}`)}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '13px' }}>{t.title}</div>
                        <span style={{ fontSize: '11px', color: 'var(--primary)' }}>{t.ticketNumber}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: t.priority === 'CRITICAL' || t.priority === 'HIGH' ? 'var(--danger)' : 'var(--text-muted)' }}>
                        {t.priority}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: `${STATUS_COLORS[t.status.replaceAll('_', ' ')] || '#6b7280'}15`, color: STATUS_COLORS[t.status.replaceAll('_', ' ')] || '#6b7280' }}>
                        {t.status.replaceAll('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Recent Clients */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', margin: 0 }}>Registered Clients</h3>
            <Button variant="ghost" onClick={() => navigate('/clients')} style={{ fontSize: '12px', padding: '4px 10px' }}>
              View All <ArrowRight size={12} />
            </Button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Company</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '32px' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
              ) : recentClients.length === 0 ? (
                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No clients found.</td></tr>
              ) : (
                recentClients.map(c => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/clients')}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '12px' }}>
                          {c.name?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '13px' }}>{c.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.contactEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '12px' }}>{c.companyName || '—'}</td>
                    <td>
                      <span className={`badge ${c.active ? 'badge-success' : 'badge-danger'}`}>
                        {c.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SupportDashboard;
