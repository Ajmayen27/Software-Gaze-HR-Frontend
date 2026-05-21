import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PayrollService } from '../../api/payroll';
import { formatBDT } from '../../utils/currency';
import Button from '../../components/ui/Button';
import { ArrowLeft, Users, Wallet, TrendingDown, TrendingUp, DollarSign, Eye, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PayrollRunDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [run, setRun] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const runData = await PayrollService.getPayrollRun(id);
        const payslipsData = await PayrollService.getPayrollRunPayslips(id);
        
        // Unwrap data if nested
        const runObj = runData?.data || runData;
        const payslipList = Array.isArray(payslipsData) ? payslipsData : (payslipsData?.data || []);
        
        if (!runObj) throw new Error("Payroll run not found");
        
        setRun(runObj);
        setPayslips(payslipList);
      } catch (err) {
        toast.error('Failed to load payroll run details');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const StatCard = ({ icon: Icon, label, value, color, bg }) => (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: bg, color }}>
        <Icon size={20} />
      </div>
      <div>
        <div className="stat-value" style={{ fontSize: '20px' }}>{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );

  const downloadPdf = async (psId, empName) => {
    try {
      const response = await PayrollService.downloadPayslipPdf(psId);
      const url = window.URL.createObjectURL(new Blob([response.data || response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Payslip_${empName || 'Employee'}_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      toast.error('Failed to download PDF');
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>;
  if (!run) return <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Could not load payroll run.</div>;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/payroll/runs')}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1>Payroll: {MONTHS[run.month - 1]} {run.year}</h1>
            <p>
              <span className={`badge ${run.status === 'APPROVED' ? 'badge-success' : run.status === 'PROCESSED' ? 'badge-warning' : 'badge-draft'}`}>{run.status}</span>
              <span style={{ marginLeft: '8px', color: 'var(--text-muted)' }}>Created: {run.createdAt || run.runDate || '—'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <StatCard icon={Users} label="Employees" value={run.employeeCount || 0} color="var(--primary)" bg="var(--primary-light)" />
        <StatCard icon={Wallet} label="Total Gross" value={formatBDT(run.totalGrossSalary || run.totalGross || 0)} color="var(--info)" bg="var(--info-light)" />
        <StatCard icon={TrendingDown} label="Total Deductions" value={formatBDT(run.totalDeductions || 0)} color="var(--danger)" bg="var(--danger-light)" />
        <StatCard icon={TrendingUp} label="Net Salary" value={formatBDT(run.totalNetSalary || run.totalNet || 0)} color="var(--success)" bg="var(--success-light)" />
        <StatCard icon={DollarSign} label="Total CTC" value={formatBDT(run.totalCtc || 0)} color="var(--warning)" bg="var(--warning-light)" />
      </div>

      {/* Payslips Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '15px', margin: 0 }}>Generated Payslips</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Basic Salary</th>
              <th>Gross Salary</th>
              <th>Deductions</th>
              <th>Net Salary</th>
              <th>CTC</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payslips.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No payslips generated for this run.</td></tr>
            ) : (
              payslips.map(ps => (
                <tr key={ps.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '12px' }}>
                        {(ps.employeeName || ps.employee?.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '13px' }}>{ps.employeeName || ps.employee?.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ps.hrEmployeeId || ps.employee?.employeeId}</div>
                      </div>
                    </div>
                  </td>
                  <td>{formatBDT(ps.basicSalary || ps.earnings?.[0]?.amount || 0)}</td>
                  <td style={{ fontWeight: 500 }}>{formatBDT(ps.grossSalary || 0)}</td>
                  <td style={{ color: 'var(--danger)' }}>{formatBDT(ps.totalDeductions || 0)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--success)' }}>{formatBDT(ps.netSalary || 0)}</td>
                  <td>{formatBDT(ps.ctc || 0)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/payroll/payslip/${ps.id}`)} title="View"><Eye size={14} /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => downloadPdf(ps.id, ps.employeeName || ps.employee?.name)} title="Download PDF"><Download size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayrollRunDetail;
