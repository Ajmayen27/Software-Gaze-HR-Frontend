import React, { useEffect, useState } from 'react';
import { axiosInstance } from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, Building2, Wallet, Plus, Play, CircleDollarSign, TrendingUp, ArrowRight, Briefcase, Ticket, AlertCircle, UserPlus } from 'lucide-react';
import Button from '../components/ui/Button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    departments: 0,
    salaryGroups: 0,
    totalClients: 0,
    activeClients: 0,
    totalTickets: 0,
    openTickets: 0
  });

  const [departmentData, setDepartmentData] = useState([]);
  const [ticketStatusData, setTicketStatusData] = useState([]);
  const [clientStatusData, setClientStatusData] = useState([]);
  const [payrollData, setPayrollData] = useState([]);
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [empRes, deptRes, sgRes, clientRes, ticketRes, payrollRes] = await Promise.all([
          axiosInstance.get('/employees?page=0&size=100&sortBy=createdAt&sortDir=desc').catch(() => null),
          axiosInstance.get('/departments').catch(() => null),
          axiosInstance.get('/salary-groups').catch(() => null),
          axiosInstance.get('/clients?page=0&size=100').catch(() => null),
          axiosInstance.get('/support-tickets?page=0&size=100').catch(() => null),
          axiosInstance.get('/payroll-runs').catch(() => null)
        ]);

        // Process Employees
        let employees = [];
        let totalEmployees = 0;
        if (empRes) {
          const page = empRes;
          if (page && page.content) {
            employees = page.content;
            totalEmployees = page.totalElements || employees.length;
          } else if (Array.isArray(page)) {
            employees = page;
            totalEmployees = page.length;
          }
        }

        // Process Departments
        const deptList = Array.isArray(deptRes) ? deptRes : [];

        // Process Salary Groups
        const sgList = Array.isArray(sgRes) ? sgRes : [];

        // Process Clients
        let clients = [];
        let totalClients = 0;
        if (clientRes) {
          const page = clientRes;
          if (page && page.content) {
            clients = page.content;
            totalClients = page.totalElements || clients.length;
          } else if (Array.isArray(page)) {
            clients = page;
            totalClients = page.length;
          }
        }

        // Process Tickets
        let tickets = [];
        let totalTickets = 0;
        if (ticketRes) {
          const page = ticketRes;
          if (page && page.content) {
            tickets = page.content;
            totalTickets = page.totalElements || tickets.length;
          } else if (Array.isArray(page)) {
            tickets = page;
            totalTickets = page.length;
          }
        }

        // Aggregate Department Data for Bar Chart
        const deptCount = {};
        employees.forEach(emp => {
          const dept = emp.department || 'Unassigned';
          deptCount[dept] = (deptCount[dept] || 0) + 1;
        });
        const deptChartData = Object.keys(deptCount).map(key => ({
          name: key,
          count: deptCount[key]
        }));

        // Aggregate Ticket Data for Pie Chart
        const ticketCount = { 'OPEN': 0, 'IN_PROGRESS': 0, 'WAITING_FOR_CLIENT': 0, 'RESOLVED': 0, 'CLOSED': 0 };
        tickets.forEach(ticket => {
          const status = ticket.status || 'OPEN';
          ticketCount[status] = (ticketCount[status] || 0) + 1;
        });
        const ticketChartData = Object.keys(ticketCount)
          .filter(key => ticketCount[key] > 0)
          .map(key => ({
            name: key.replaceAll('_', ' '),
            value: ticketCount[key]
          }));

        // Aggregate Client Data for Donut Chart
        const activeClients = clients.filter(c => c.active !== false).length; // Default to active if undefined
        const inactiveClients = totalClients - activeClients;
        const clientChartData = [
          { name: 'Active', value: activeClients },
          { name: 'Inactive', value: inactiveClients }
        ].filter(d => d.value > 0);

        setStats({
          totalEmployees,
          activeEmployees: employees.filter(e => e.status === 'ACTIVE').length || totalEmployees,
          departments: deptList.length,
          salaryGroups: sgList.length,
          totalClients,
          activeClients,
          totalTickets,
          openTickets: tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length
        });

        // Process Payroll Runs for Expense Chart
        let payrollRuns = [];
        if (payrollRes) {
          const prPage = Array.isArray(payrollRes) ? payrollRes : (payrollRes.content || payrollRes.data || []);
          if (Array.isArray(prPage)) payrollRuns = prPage;
        }

        // Aggregate Payroll Expenses Data
        const expenseMap = {};
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        payrollRuns.forEach(run => {
          if (run.status === 'APPROVED' || run.status === 'PROCESSED') {
            const monthLabel = `${monthNames[run.month - 1]} ${run.year}`;
            expenseMap[monthLabel] = (expenseMap[monthLabel] || 0) + (run.totalCtc || run.totalGross || 0);
          }
        });

        let payrollChartData = Object.keys(expenseMap).map(key => ({
          name: key,
          expense: expenseMap[key]
        }));

        // Fallback to demo data if empty
        if (payrollChartData.length === 0) {
          payrollChartData = [
            { name: 'Mar 2026', expense: 106000 },
            { name: 'Apr 2026', expense: 106000 },
            { name: 'May 2026', expense: 112000 },
            { name: 'Jun 2026', expense: 115000 },
            { name: 'Jul 2026', expense: 125000 },
          ];
        }

        setDepartmentData(deptChartData);
        setTicketStatusData(ticketChartData);
        setClientStatusData(clientChartData);
        setPayrollData(payrollChartData);

        setRecentEmployees(employees.slice(0, 5));
        setRecentTickets(tickets.slice(0, 5));
      } catch (err) {
        console.error('Dashboard stats failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const StatCard = ({ icon: Icon, label, value, color, bg }) => (
    <div className="stat-card" style={{ transition: 'transform 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
      <div className="stat-icon" style={{ background: bg, color }}>
        <Icon size={22} />
      </div>
      <div>
        <div className="stat-value" style={{ fontSize: '24px', fontWeight: '700' }}>{loading ? '—' : value}</div>
        <div className="stat-label" style={{ fontSize: '13px', fontWeight: '500' }}>{label}</div>
      </div>
    </div>
  );

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const TICKET_COLORS = { 'OPEN': '#ef4444', 'IN PROGRESS': '#f59e0b', 'WAITING FOR CLIENT': '#3b82f6', 'RESOLVED': '#10b981', 'CLOSED': '#6b7280' };
  const CLIENT_COLORS = { 'Active': '#10b981', 'Inactive': '#ef4444' };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '30px' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '0' }}>
        <div>
          <h1>Admin Dashboard</h1>
          <p>Comprehensive overview of SoftwareGaze HR Management System</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" onClick={() => navigate('/payroll/runs')}>
            <Play size={14} /> Run Payroll
          </Button>
          <Button className="btn-primary" onClick={() => navigate('/employees/new')}>
            <Plus size={14} /> Add Employee
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard icon={Users} label="Total Employees" value={stats.totalEmployees} color="#3b82f6" bg="rgba(59, 130, 246, 0.15)" />
        <StatCard icon={Briefcase} label="Total Clients" value={stats.totalClients} color="#8b5cf6" bg="rgba(139, 92, 246, 0.15)" />
        <StatCard icon={Ticket} label="Active Tickets" value={stats.openTickets} color="#f59e0b" bg="rgba(245, 158, 11, 0.15)" />
        <StatCard icon={Building2} label="Departments" value={stats.departments} color="#10b981" bg="rgba(16, 185, 129, 0.15)" />
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>

        {/* Employee Department Distribution */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', marginBottom: '20px', color: 'var(--text-primary)' }}>Employees by Department</h3>
          <div style={{ height: '250px', width: '100%' }}>
            {loading ? (
              <div className="spinner" style={{ margin: '100px auto' }} />
            ) : departmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} allowDecimals={false} />
                  <RechartsTooltip cursor={{ fill: 'var(--bg-hover)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available</div>
            )}
          </div>
        </div>

        {/* Support Tickets Status */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', marginBottom: '20px', color: 'var(--text-primary)' }}>Support Tickets Status</h3>
          <div style={{ height: '250px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {loading ? (
              <div className="spinner" />
            ) : ticketStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ticketStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                    {ticketStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={TICKET_COLORS[entry.name] || COLORS[index % COLORS.length]} />
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
              <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: TICKET_COLORS[entry.name] || COLORS[index % COLORS.length] }} />
                <span>{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Client Status Distribution */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', marginBottom: '20px', color: 'var(--text-primary)' }}>Client Status</h3>
          <div style={{ height: '250px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {loading ? (
              <div className="spinner" />
            ) : clientStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={clientStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                    {clientStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CLIENT_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>No client data available</div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '10px', flexWrap: 'wrap' }}>
            {clientStatusData.map((entry, index) => (
              <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: CLIENT_COLORS[entry.name] || COLORS[index % COLORS.length] }} />
                <span>{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Monthly Expenses Chart */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '15px', marginBottom: '20px', color: 'var(--text-primary)' }}>Company Monthly Expenses (Payroll)</h3>
        <div style={{ height: '300px', width: '100%' }}>
          {loading ? (
            <div className="spinner" style={{ margin: '100px auto' }} />
          ) : payrollData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={payrollData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} tickFormatter={(value) => `৳${value.toLocaleString()}`} />
                <RechartsTooltip cursor={{ fill: 'var(--bg-hover)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} formatter={(value) => [`৳${value.toLocaleString()}`, 'Total Expense']} />
                <Area type="monotone" dataKey="expense" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No expense data available</div>
          )}
        </div>
      </div>

      {/* Quick Actions (Compact) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Add Employee', desc: 'Onboard a new team member', icon: Users, path: '/employees/new', color: '#3b82f6' },
          { label: 'Register Support', desc: 'Create support staff account', icon: UserPlus, path: '/support-staff/register', color: '#7c3aed' },
          { label: 'View Clients', desc: 'Manage your client base', icon: Briefcase, path: '/clients', color: '#8b5cf6' },
          { label: 'Support Tickets', desc: 'Resolve client issues', icon: AlertCircle, path: '/support-tickets', color: '#f59e0b' },
          { label: 'Run Payroll', desc: 'Process monthly salaries', icon: Wallet, path: '/payroll/runs', color: '#10b981' },
        ].map(action => (
          <div key={action.label} className="card" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', transition: 'all 0.2s' }}
            onMouseOver={e => e.currentTarget.style.borderColor = action.color} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
            onClick={() => navigate(action.path)}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${action.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: action.color, flexShrink: 0 }}>
              <action.icon size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '13px' }}>{action.label}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{action.desc}</div>
            </div>
            <ArrowRight size={14} color="var(--text-muted)" />
          </div>
        ))}
      </div>

      {/* Data Tables Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', gridAutoRows: 'min-content' }}>

        {/* Recent Employees */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', margin: 0 }}>Recent Employees</h3>
            <Button variant="ghost" onClick={() => navigate('/employees')} style={{ fontSize: '12px', padding: '4px 10px' }}>
              View All <ArrowRight size={12} />
            </Button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Department</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '32px' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
              ) : recentEmployees.length === 0 ? (
                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No employees found.</td></tr>
              ) : (
                recentEmployees.map(emp => (
                  <tr key={emp.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/employees/${emp.id}/profile`)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '12px', flexShrink: 0 }}>
                          {emp.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '13px' }}>{emp.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.designation || 'Employee'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{emp.department || '—'}</td>
                    <td><span className={`badge ${emp.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>{emp.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Recent Tickets */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', margin: 0 }}>Recent Support Tickets</h3>
            <Button variant="ghost" onClick={() => navigate('/support-tickets')} style={{ fontSize: '12px', padding: '4px 10px' }}>
              View All <ArrowRight size={12} />
            </Button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="2" style={{ textAlign: 'center', padding: '32px' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
              ) : recentTickets.length === 0 ? (
                <tr><td colSpan="2" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No recent tickets.</td></tr>
              ) : (
                recentTickets.map(ticket => (
                  <tr key={ticket.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/support-tickets/${ticket.id}`)}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '13px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ticket.subject}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ticket.clientName || ticket.clientId || 'Unknown Client'}</div>
                    </td>
                    <td><span className={`badge`} style={{ backgroundColor: `${TICKET_COLORS[ticket.status] || '#6b7280'}20`, color: TICKET_COLORS[ticket.status] || '#6b7280' }}>{ticket.status?.replace('_', ' ')}</span></td>
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

export default Dashboard;

