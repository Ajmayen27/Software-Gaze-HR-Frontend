import React, { useEffect, useState } from 'react';
import { axiosInstance } from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, Building2, Wallet, Plus, Play, CircleDollarSign, TrendingUp, ArrowRight, Briefcase, Ticket, AlertCircle, UserPlus, DollarSign, Tag } from 'lucide-react';
import Button from '../components/ui/Button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line
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
  const [expensesByType, setExpensesByType] = useState([]);
  const [expensesTrend, setExpensesTrend] = useState([]);
  const [expensesByTag, setExpensesByTag] = useState([]);
  const [expenseStats, setExpenseStats] = useState({ totalExpenses: 0, monthlyExpenses: 0, expenseCount: 0 });
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [empRes, deptRes, sgRes, clientRes, ticketRes, payrollRes, expenseRes] = await Promise.all([
          axiosInstance.get('/employees?page=0&size=100&sortBy=createdAt&sortDir=desc').catch(() => null),
          axiosInstance.get('/departments').catch(() => null),
          axiosInstance.get('/salary-groups').catch(() => null),
          axiosInstance.get('/clients?page=0&size=100').catch(() => null),
          axiosInstance.get('/support-tickets?page=0&size=100').catch(() => null),
          axiosInstance.get('/payroll-runs').catch(() => null),
          axiosInstance.get('/expenses?page=0&size=500').catch(() => null)
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

        // Process Expenses
        let expenses = [];
        if (expenseRes) {
          const expensePage = expenseRes.content || expenseRes.data || expenseRes;
          if (Array.isArray(expensePage)) expenses = expensePage;
        }

        // Aggregate Expenses by Type
        const expenseTypeMap = {};
        let totalExpenses = 0;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        let monthlyExpenses = 0;

        expenses.forEach(exp => {
          if (exp.amount) {
            totalExpenses += exp.amount;
            expenseTypeMap[exp.billType || 'Other'] = (expenseTypeMap[exp.billType || 'Other'] || 0) + exp.amount;
            
            if (exp.date) {
              const expDate = new Date(exp.date);
              if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
                monthlyExpenses += exp.amount;
              }
            }
          }
        });

        const expenseTypeData = Object.keys(expenseTypeMap)
          .sort((a, b) => expenseTypeMap[b] - expenseTypeMap[a])
          .slice(0, 8)
          .map(key => ({
            name: key,
            amount: expenseTypeMap[key]
          }));

        // Aggregate Expenses by Tag
        const expenseTagMap = {};
        expenses.forEach(exp => {
          if (exp.tag) {
            expenseTagMap[exp.tag] = (expenseTagMap[exp.tag] || 0) + (exp.amount || 0);
          }
        });

        const expenseTagData = Object.keys(expenseTagMap)
          .map(key => ({
            name: key,
            value: expenseTagMap[key]
          }))
          .filter(d => d.value > 0);

        // Aggregate Expenses Trend (Last 6 months)
        const expenseTrendMap = {};
        const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthLabel = `${monthLabels[date.getMonth()]} ${date.getFullYear()}`;
          expenseTrendMap[monthLabel] = 0;
        }

        expenses.forEach(exp => {
          if (exp.date && exp.amount) {
            const expDate = new Date(exp.date);
            const monthLabel = `${monthLabels[expDate.getMonth()]} ${expDate.getFullYear()}`;
            if (expenseTrendMap[monthLabel] !== undefined) {
              expenseTrendMap[monthLabel] += exp.amount;
            }
          }
        });

        const expenseTrendData = Object.keys(expenseTrendMap).map(key => ({
          name: key,
          amount: expenseTrendMap[key]
        }));

        setExpenseStats({
          totalExpenses,
          monthlyExpenses,
          expenseCount: expenses.length
        });
        setExpensesByType(expenseTypeData);
        setExpensesByTag(expenseTagData);
        setExpensesTrend(expenseTrendData);

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const EXPENSE_COLORS = ['#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#3b82f6', '#6366f1'];
  const TAG_COLORS = { 'Paid': '#10b981', 'Pending': '#f59e0b', 'Rejected': '#ef4444', 'Draft': '#94a3b8' };
  const TICKET_COLORS = { 'OPEN': '#ef4444', 'IN PROGRESS': '#f59e0b', 'WAITING FOR CLIENT': '#3b82f6', 'RESOLVED': '#10b981', 'CLOSED': '#6b7280' };
  const CLIENT_COLORS = { 'Active': '#10b981', 'Inactive': '#ef4444' };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '40px' }}>
      
      {/* Dynamic Welcome Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)',
        borderRadius: '16px',
        padding: '32px',
        color: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Abstract design elements */}
        <div style={{
          position: 'absolute', right: '-5%', top: '-20%',
          width: '280px', height: '280px', borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.12)', filter: 'blur(35px)'
        }} />
        <div style={{
          position: 'absolute', right: '15%', bottom: '-30%',
          width: '180px', height: '180px', borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)', filter: 'blur(25px)'
        }} />

        <div style={{ zIndex: 1 }}>
          <span style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: 700,
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '4px 10px',
            borderRadius: '20px',
            backdropFilter: 'blur(4px)'
          }}>
            {getFormattedDate()}
          </span>
          <h1 style={{ color: '#ffffff', fontSize: '28px', fontWeight: 800, margin: '14px 0 6px 0', letterSpacing: '-0.5px' }}>
            {getGreeting()}, Admin 👋
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', margin: 0, fontWeight: 400 }}>
            Here is a comprehensive overview of your SoftwareGaze HR workspace today.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', zIndex: 1 }}>
          <button 
            className="btn"
            onClick={() => navigate('/payroll/runs')}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              backdropFilter: 'blur(4px)',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
          >
            <Play size={13} fill="#fff" /> Run Payroll
          </button>
          <button 
            className="btn"
            onClick={() => navigate('/employees/new')}
            style={{
              background: '#ffffff',
              color: '#4f46e5',
              border: '1px solid #ffffff',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'none'}
          >
            <Plus size={14} style={{ strokeWidth: 3 }} /> Add Employee
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        
        {/* Stat 1: Employees */}
        <div className="stat-card" style={{
          padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px',
          border: '1px solid var(--border-color)', background: 'var(--bg-card)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer'
        }}
        onMouseOver={e => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          e.currentTarget.style.borderColor = '#4f46e5';
        }}
        onMouseOut={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          e.currentTarget.style.borderColor = 'var(--border-color)';
        }}
        onClick={() => navigate('/employees')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Employees
            </span>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(79, 70, 229, 0.08)', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              {loading ? '—' : stats.totalEmployees}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>{stats.activeEmployees}</span> active in workspace
            </div>
            {/* Progress Bar indicator */}
            {!loading && stats.totalEmployees > 0 && (
              <div style={{ height: '4px', width: '100%', background: 'var(--border-light)', borderRadius: '2px', marginTop: '12px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#4f46e5', width: `${(stats.activeEmployees / stats.totalEmployees) * 100}%` }} />
              </div>
            )}
          </div>
        </div>

        {/* Stat 2: Clients */}
        <div className="stat-card" style={{
          padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px',
          border: '1px solid var(--border-color)', background: 'var(--bg-card)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer'
        }}
        onMouseOver={e => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          e.currentTarget.style.borderColor = '#8b5cf6';
        }}
        onMouseOut={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          e.currentTarget.style.borderColor = 'var(--border-color)';
        }}
        onClick={() => navigate('/clients')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Clients
            </span>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.08)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={20} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              {loading ? '—' : stats.totalClients}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>{stats.activeClients}</span> active accounts
            </div>
            {/* Progress Bar indicator */}
            {!loading && stats.totalClients > 0 && (
              <div style={{ height: '4px', width: '100%', background: 'var(--border-light)', borderRadius: '2px', marginTop: '12px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#8b5cf6', width: `${(stats.activeClients / stats.totalClients) * 100}%` }} />
              </div>
            )}
          </div>
        </div>

        {/* Stat 3: Active Tickets */}
        <div className="stat-card" style={{
          padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px',
          border: '1px solid var(--border-color)', background: 'var(--bg-card)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer'
        }}
        onMouseOver={e => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          e.currentTarget.style.borderColor = '#f59e0b';
        }}
        onMouseOut={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          e.currentTarget.style.borderColor = 'var(--border-color)';
        }}
        onClick={() => navigate('/support-tickets')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Active Tickets
            </span>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ticket size={20} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              {loading ? '—' : stats.openTickets}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              out of <span style={{ fontWeight: 600 }}>{stats.totalTickets}</span> total tickets logged
            </div>
            {/* Progress Bar indicator */}
            {!loading && stats.totalTickets > 0 && (
              <div style={{ height: '4px', width: '100%', background: 'var(--border-light)', borderRadius: '2px', marginTop: '12px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#f59e0b', width: `${(stats.openTickets / stats.totalTickets) * 100}%` }} />
              </div>
            )}
          </div>
        </div>

        {/* Stat 4: Departments */}
        <div className="stat-card" style={{
          padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px',
          border: '1px solid var(--border-color)', background: 'var(--bg-card)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer'
        }}
        onMouseOver={e => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          e.currentTarget.style.borderColor = '#10b981';
        }}
        onMouseOut={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          e.currentTarget.style.borderColor = 'var(--border-color)';
        }}
        onClick={() => navigate('/lookup/departments')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Departments
            </span>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={20} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              {loading ? '—' : stats.departments}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              with <span style={{ fontWeight: 600 }}>{stats.salaryGroups}</span> salary components
            </div>
            <div style={{ height: '4px', width: '100%', background: 'var(--border-light)', borderRadius: '2px', marginTop: '12px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#10b981', width: '100%' }} />
            </div>
          </div>
        </div>

        {/* Stat 5: Expenses */}
        <div className="stat-card" style={{
          padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px',
          border: '1px solid var(--border-color)', background: 'var(--bg-card)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer'
        }}
        onMouseOver={e => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          e.currentTarget.style.borderColor = '#f59e0b';
        }}
        onMouseOut={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          e.currentTarget.style.borderColor = 'var(--border-color)';
        }}
        onClick={() => navigate('/expenses')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Expenses
            </span>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              {loading ? '—' : `৳${(expenseStats.totalExpenses / 1000).toFixed(1)}K`}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#f59e0b', fontWeight: 600 }}>৳{(expenseStats.monthlyExpenses / 1000).toFixed(1)}K</span> this month
            </div>
            {/* Progress Bar indicator */}
            {!loading && expenseStats.totalExpenses > 0 && (
              <div style={{ height: '4px', width: '100%', background: 'var(--border-light)', borderRadius: '2px', marginTop: '12px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#f59e0b', width: `${Math.min((expenseStats.monthlyExpenses / expenseStats.totalExpenses) * 100, 100)}%` }} />
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Expense Visualizations Block */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
        
        {/* Expense Trend Chart */}
        <div className="card" style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Expense Trend</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Monthly operational expenses over time</p>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', padding: '4px 10px', borderRadius: '20px' }}>
              Last 6 Months
            </span>
          </div>

          <div style={{ height: '280px', width: '100%' }}>
            {loading ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
            ) : expensesTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={expensesTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border-light)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 500 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 500 }} tickFormatter={(value) => `৳${(value / 1000).toFixed(0)}K`} />
                  <RechartsTooltip 
                    cursor={{ stroke: 'rgba(245, 158, 11, 0.2)', strokeWidth: 2 }}
                    contentStyle={{ 
                      borderRadius: '12px', 
                      background: 'var(--bg-card)', 
                      border: '1px solid var(--border-color)', 
                      boxShadow: 'var(--shadow-lg)',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-family)'
                    }} 
                    formatter={(value) => [`৳${value.toLocaleString()}`, 'Total Expense']} 
                  />
                  <Line type="monotone" dataKey="amount" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 5 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No expense trend data available</div>
            )}
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="card" style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Expenses by Category</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Breakdown by bill type/category</p>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, background: 'rgba(139, 92, 246, 0.08)', color: '#8b5cf6', padding: '4px 10px', borderRadius: '20px' }}>
              {expenseStats.expenseCount} entries
            </span>
          </div>

          <div style={{ height: '280px', width: '100%' }}>
            {loading ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
            ) : expensesByType.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expensesByType} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="4 4" vertical={true} stroke="var(--border-light)" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 500 }} tickFormatter={(value) => `৳${(value / 1000).toFixed(0)}K`} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 500 }} width={100} />
                  <RechartsTooltip 
                    cursor={{ fill: 'rgba(139, 92, 246, 0.04)' }} 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      background: 'var(--bg-card)', 
                      border: '1px solid var(--border-color)', 
                      boxShadow: 'var(--shadow-lg)',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-family)'
                    }} 
                    formatter={(value) => [`৳${value.toLocaleString()}`, 'Amount']}
                  />
                  <Bar dataKey="amount" fill="#8b5cf6" radius={[0, 6, 6, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No expense category data available</div>
            )}
          </div>
        </div>

      </div>

      {/* Primary Visualizations Block (Area and Bar charts side-by-side or stacked) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
        
        {/* Monthly Expenses Chart */}
        <div className="card" style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Company Monthly Expenses</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Payroll cost distributions over time</p>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, background: 'rgba(139, 92, 246, 0.08)', color: '#8b5cf6', padding: '4px 10px', borderRadius: '20px' }}>
              Monthly Gross CTC
            </span>
          </div>

          <div style={{ height: '280px', width: '100%' }}>
            {loading ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
            ) : payrollData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={payrollData} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border-light)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 500 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 500 }} tickFormatter={(value) => `৳${value.toLocaleString()}`} />
                  <RechartsTooltip 
                    cursor={{ stroke: 'rgba(139, 92, 246, 0.2)', strokeWidth: 1 }}
                    contentStyle={{ 
                      borderRadius: '12px', 
                      background: 'var(--bg-card)', 
                      border: '1px solid var(--border-color)', 
                      boxShadow: 'var(--shadow-lg)',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-family)'
                    }} 
                    formatter={(value) => [`৳${value.toLocaleString()}`, 'Total Expense']} 
                  />
                  <Area type="monotone" dataKey="expense" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No expense data available</div>
            )}
          </div>
        </div>

        {/* Employees by Department */}
        <div className="card" style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Employees by Department</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Staff headcount spread across divisions</p>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, background: 'rgba(79, 70, 229, 0.08)', color: '#4f46e5', padding: '4px 10px', borderRadius: '20px' }}>
              Headcount
            </span>
          </div>

          <div style={{ height: '280px', width: '100%' }}>
            {loading ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
            ) : departmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.85}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.4}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border-light)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 500 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 500 }} allowDecimals={false} />
                  <RechartsTooltip 
                    cursor={{ fill: 'rgba(79, 70, 229, 0.04)' }} 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      background: 'var(--bg-card)', 
                      border: '1px solid var(--border-color)', 
                      boxShadow: 'var(--shadow-lg)',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-family)'
                    }} 
                  />
                  <Bar dataKey="count" fill="url(#colorCount)" radius={[6, 6, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No department data registered</div>
            )}
          </div>
        </div>

      </div>

      {/* Donut Distribution Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Support Tickets Status */}
        <div className="card" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Support Tickets</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Ticket allocations by current status</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', height: '180px' }}>
            <div style={{ flex: 1, height: '100%', minWidth: 140 }}>
              {loading ? (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
              ) : ticketStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={ticketStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                      {ticketStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={TICKET_COLORS[entry.name.toUpperCase()] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ 
                        borderRadius: '10px', 
                        background: 'var(--bg-card)', 
                        border: '1px solid var(--border-color)', 
                        boxShadow: 'var(--shadow-md)',
                        fontSize: '11px' 
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>No active tickets</div>
              )}
            </div>

            {/* Custom Side Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, paddingRight: '10px' }}>
              {ticketStatusData.map((entry, index) => (
                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: TICKET_COLORS[entry.name.toUpperCase()] || COLORS[index % COLORS.length] }} />
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    {entry.name}: <strong style={{ color: 'var(--text-primary)' }}>{entry.value}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Client Status Distribution */}
        <div className="card" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Client Distribution</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Client health status metric</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', height: '180px' }}>
            <div style={{ flex: 1, height: '100%', minWidth: 140 }}>
              {loading ? (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
              ) : clientStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={clientStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                      {clientStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CLIENT_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ 
                        borderRadius: '10px', 
                        background: 'var(--bg-card)', 
                        border: '1px solid var(--border-color)', 
                        boxShadow: 'var(--shadow-md)',
                        fontSize: '11px' 
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>No clients recorded</div>
              )}
            </div>

            {/* Custom Side Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, paddingRight: '20px' }}>
              {clientStatusData.map((entry, index) => (
                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: CLIENT_COLORS[entry.name] || COLORS[index % COLORS.length] }} />
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    {entry.name}: <strong style={{ color: 'var(--text-primary)' }}>{entry.value}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expense Status Distribution */}
        <div className="card" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Expense Status</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Amount distribution by approval status</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', height: '180px' }}>
            <div style={{ flex: 1, height: '100%', minWidth: 140 }}>
              {loading ? (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
              ) : expensesByTag.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expensesByTag} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                      {expensesByTag.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={TAG_COLORS[entry.name] || EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ 
                        borderRadius: '10px', 
                        background: 'var(--bg-card)', 
                        border: '1px solid var(--border-color)', 
                        boxShadow: 'var(--shadow-md)',
                        fontSize: '11px' 
                      }} 
                      formatter={(value) => `৳${value.toLocaleString()}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>No expense data</div>
              )}
            </div>

            {/* Custom Side Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, paddingRight: '10px' }}>
              {expensesByTag.map((entry, index) => (
                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: TAG_COLORS[entry.name] || EXPENSE_COLORS[index % EXPENSE_COLORS.length] }} />
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    {entry.name}: <strong style={{ color: 'var(--text-primary)' }}>৳{(entry.value / 1000).toFixed(1)}K</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Action Center Section */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>Quick Management Center</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Add Employee', desc: 'Onboard team member', icon: Users, path: '/employees/new', color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.06)' },
            { label: 'Register Support', desc: 'Create support account', icon: UserPlus, path: '/support-staff/register', color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.06)' },
            { label: 'Manage Clients', desc: 'View current client list', icon: Briefcase, path: '/clients', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.06)' },
            { label: 'Support Tickets', desc: 'Monitor system tickets', icon: AlertCircle, path: '/support-tickets', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.06)' },
            { label: 'Run Payroll', desc: 'Process salaries & runs', icon: Wallet, path: '/payroll/runs', color: '#10b981', bg: 'rgba(16, 185, 129, 0.06)' },
            { label: 'Track Expenses', desc: 'View all expenses', icon: DollarSign, path: '/expenses', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.06)' },
          ].map(action => (
            <div 
              key={action.label} 
              className="card" 
              style={{ 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '14px', 
                padding: '20px 16px', 
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)' 
              }}
              onMouseOver={e => {
                e.currentTarget.style.borderColor = action.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }} 
              onMouseOut={e => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
              onClick={() => navigate(action.path)}
            >
              <div style={{ 
                width: '42px', 
                height: '42px', 
                borderRadius: '10px', 
                background: action.bg, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: action.color, 
                flexShrink: 0 
              }}>
                <action.icon size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 650, fontSize: '13px', color: 'var(--text-primary)' }}>{action.label}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                  {action.desc}
                </div>
              </div>
              <ArrowRight size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Elegant Data Tables Side-by-Side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>

        {/* Recent Employees Table */}
        <div className="card" style={{ padding: 0, borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Recent Employees</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Latest additions to the directory</p>
            </div>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => navigate('/employees')} 
              style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px' }}
            >
              View All <ArrowRight size={12} style={{ marginLeft: 2 }} />
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : recentEmployees.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No employees registered yet.
                  </td>
                </tr>
              ) : (
                recentEmployees.map(emp => (
                  <tr key={emp.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/employees/${emp.id}/profile`)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '50%', 
                          background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)', 
                          color: '#ffffff', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontWeight: 600, 
                          fontSize: '11px', 
                          flexShrink: 0 
                        }}>
                          {emp.name?.charAt(0)?.toUpperCase() || 'E'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>{emp.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{emp.designation || 'Designation'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{emp.department || '—'}</span>
                    </td>
                    <td>
                      <span className={`badge ${emp.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '10px', padding: '3px 8px' }}>
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Recent Tickets Table */}
        <div className="card" style={{ padding: 0, borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Recent Tickets</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Latest support logs from clients</p>
            </div>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => navigate('/support-tickets')} 
              style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px' }}
            >
              View All <ArrowRight size={12} style={{ marginLeft: 2 }} />
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Subject & Client</th>
                <th>Status Badge</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="2" style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : recentTickets.length === 0 ? (
                <tr>
                  <td colSpan="2" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No support tickets logged.
                  </td>
                </tr>
              ) : (
                recentTickets.map(ticket => (
                  <tr key={ticket.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/support-tickets/${ticket.id}`)}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ticket.subject}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {ticket.clientName || ticket.clientId || 'Client'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ 
                        backgroundColor: `${TICKET_COLORS[ticket.status] || '#6b7280'}12`, 
                        color: TICKET_COLORS[ticket.status] || '#6b7280',
                        fontSize: '10px',
                        padding: '3px 8px',
                        border: `1px solid ${TICKET_COLORS[ticket.status] || '#6b7280'}25`
                      }}>
                        {ticket.status?.replaceAll('_', ' ')}
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

export default Dashboard;

