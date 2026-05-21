import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PayrollService } from '../../api/payroll';
import { formatBDT } from '../../utils/currency';
import Button from '../../components/ui/Button';
import { ArrowLeft, Download, User, Calendar, Briefcase, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const PayslipDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ps, setPs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await PayrollService.getPayslip(id);
        const data = response?.data || response;
        if (!data) throw new Error("Payslip not found");
        setPs(data);
      } catch (err) {
        toast.error('Failed to load payslip details');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const downloadPdf = async () => {
    try {
      const response = await PayrollService.downloadPayslipPdf(id);
      const url = window.URL.createObjectURL(new Blob([response.data || response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Payslip_${ps.employeeName || 'Employee'}_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      toast.error('Failed to download PDF');
    }
  };

  const InfoItem = ({ icon: Icon, label, value }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Icon size={14} color="var(--text-muted)" />
      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}:</span>
      <span style={{ fontSize: '13px', fontWeight: 500 }}>{value}</span>
    </div>
  );

  const SalaryTable = ({ title, items, color }) => (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-body)' }}>
        <h4 style={{ margin: 0, fontSize: '13px', color }}>{title}</h4>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Component</th>
            <th style={{ textAlign: 'right' }}>Amount (BDT)</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan="2" style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>No items</td></tr>
          ) : (
            items.map((item, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.componentName || item.name}</td>
                <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>{formatBDT(item.amount)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>;
  if (!ps) return <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Payslip not found.</div>;

  const earnings = (ps.items || ps.earnings || []).filter(i => i.componentType === 'EARNING' || !i.componentType);
  const deductions = (ps.items || ps.deductions || []).filter(i => i.componentType === 'DEDUCTION');
  const employerContribs = (ps.items || ps.employerContributions || []).filter(i => i.componentType === 'EMPLOYER_CONTRIBUTION');

  const empName = ps.employeeName || ps.employee?.name || 'Unknown';
  const empId = ps.hrEmployeeId || ps.employee?.employeeId || '—';
  const designation = ps.employee?.designation || '—';
  const department = ps.employee?.department || '—';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px' }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1>Payslip</h1>
            <p>{MONTHS[ps.month - 1]} {ps.year}</p>
          </div>
        </div>
        <Button className="btn-primary" onClick={downloadPdf}>
          <Download size={14} /> Download PDF
        </Button>
      </div>

      {/* Employee Info */}
      <div className="card" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px' }}>
          {empName.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '18px', fontWeight: 600 }}>{empName}</div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <InfoItem icon={User} label="ID" value={empId} />
            <InfoItem icon={Briefcase} label="Role" value={designation} />
            <InfoItem icon={Building2} label="Dept" value={department} />
            <InfoItem icon={Calendar} label="Period" value={`${MONTHS[ps.month - 1]} ${ps.year}`} />
          </div>
        </div>
      </div>

      {/* Salary Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <SalaryTable title="💰 Earnings" items={earnings} color="var(--success)" />
        <SalaryTable title="📉 Deductions" items={deductions} color="var(--danger)" />
      </div>

      <SalaryTable title="🏢 Employer Contributions" items={employerContribs} color="var(--info)" />

      {/* Summary */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-body)' }}>
          <h4 style={{ margin: 0, fontSize: '13px' }}>Salary Summary</h4>
        </div>
        <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Gross Salary', value: ps.grossSalary, color: 'var(--text-primary)' },
            { label: 'Total Deductions', value: ps.totalDeductions, color: 'var(--danger)' },
            { label: 'Net Salary', value: ps.netSalary, color: 'var(--success)' },
            { label: 'Employer Contributions', value: ps.employerContributions || ps.employerContributionsTotal || 0, color: 'var(--info)' },
            { label: 'Cost to Company (CTC)', value: ps.ctc, color: 'var(--primary)' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: s.color, fontFamily: 'monospace' }}>{formatBDT(s.value || 0)}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PayslipDetail;
