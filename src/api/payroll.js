import { axiosInstance } from './axiosInstance';

// Helper: safely extract array from response
const toArray = (res) => {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  if (res && Array.isArray(res.content)) return res.content;
  return [];
};

/**
 * Payroll API Service
 * These endpoints are planned for the backend. Until available,
 * the UI will show demo data from the BDT salary example.
 */
export const PayrollService = {
  // ── Salary Components ──
  getSalaryComponents: async (salaryGroupId = '') => {
    try {
      const url = salaryGroupId ? `/salary-components?salaryGroupId=${salaryGroupId}` : '/salary-components';
      return toArray(await axiosInstance.get(url));
    } catch {
      return null;
    }
  },
  createSalaryComponent: (data) => axiosInstance.post('/salary-components', data),
  updateSalaryComponent: (id, data) => axiosInstance.put(`/salary-components/${id}`, data),
  deleteSalaryComponent: (id) => axiosInstance.delete(`/salary-components/${id}`),

  // ── Salary Group Components ──
  getSalaryGroupComponents: async (groupId) => {
    try {
      return toArray(await axiosInstance.get(`/salary-groups/${groupId}/components`));
    } catch {
      return null;
    }
  },
  addComponentToGroup: (groupId, data) => axiosInstance.post(`/salary-groups/${groupId}/components`, data),
  removeComponentFromGroup: (groupId, componentId) => axiosInstance.delete(`/salary-groups/${groupId}/components/${componentId}`),

  // ── Payroll Runs ──
  getPayrollRuns: async () => {
    try {
      return toArray(await axiosInstance.get('/payroll-runs'));
    } catch {
      return null;
    }
  },
  getPayrollRun: async (id) => {
    try {
      return await axiosInstance.get(`/payroll-runs/${id}`);
    } catch {
      return null;
    }
  },
  getPayrollRunPayslips: async (id) => {
    try {
      return toArray(await axiosInstance.get(`/payroll-runs/${id}/payslips`));
    } catch {
      return null;
    }
  },
  createPayrollRun: (data) => axiosInstance.post('/payroll-runs', data),
  processPayrollRun: (id, data = {}) => axiosInstance.post(`/payroll-runs/${id}/process`, data),
  approvePayrollRun: (id) => axiosInstance.post(`/payroll-runs/${id}/approve`),

  // ── Payslips ──
  getPayslip: async (id) => {
    try {
      return await axiosInstance.get(`/payslips/${id}`);
    } catch {
      return null;
    }
  },
  downloadPayslipPdf: (id) => axiosInstance.get(`/payslips/${id}/download`, { responseType: 'blob' }),

  // ── My Payslips ──
  getMyPayslips: async () => {
    try {
      return toArray(await axiosInstance.get('/my-profile/payslips'));
    } catch {
      return null;
    }
  },
  downloadMyPayslipPdf: (id) => axiosInstance.get(`/my-profile/payslips/${id}/download`, { responseType: 'blob' }),
};

// ── Demo data for UI previews (BDT example) ──
export const DEMO_SALARY_COMPONENTS = [
  { id: 1, name: 'Basic Salary', type: 'EARNING', calculationType: 'PERCENTAGE_OF_CTC', value: 60, displayOrder: 1, active: true, description: 'Base pay component' },
  { id: 2, name: 'House Rent Allowance', type: 'EARNING', calculationType: 'PERCENTAGE_OF_BASIC', value: 50, displayOrder: 2, active: true, description: 'HRA for accommodation' },
  { id: 3, name: 'Medical Allowance', type: 'EARNING', calculationType: 'FIXED', value: 3000, displayOrder: 3, active: true, description: 'Medical expenses' },
  { id: 4, name: 'Conveyance', type: 'EARNING', calculationType: 'FIXED', value: 2000, displayOrder: 4, active: true, description: 'Travel allowance' },
  { id: 5, name: 'Employee PF', type: 'DEDUCTION', calculationType: 'PERCENTAGE_OF_BASIC', value: 10, displayOrder: 5, active: true, description: 'Provident fund (employee)' },
  { id: 6, name: 'Income Tax', type: 'DEDUCTION', calculationType: 'FIXED', value: 2000, displayOrder: 6, active: true, description: 'TDS deduction' },
  { id: 7, name: 'Employer PF', type: 'EMPLOYER_CONTRIBUTION', calculationType: 'PERCENTAGE_OF_BASIC', value: 10, displayOrder: 7, active: true, description: 'Provident fund (employer)' },
];

export const DEMO_PAYROLL_RUNS = [
  { id: 1, month: 3, year: 2026, status: 'APPROVED', notes: 'March 2026 Payroll', employeeCount: 2, totalGross: 100000, totalDeductions: 10000, totalNet: 90000, totalCtc: 106000, createdAt: '2026-03-28' },
  { id: 2, month: 4, year: 2026, status: 'PROCESSED', notes: 'April 2026 Payroll', employeeCount: 2, totalGross: 100000, totalDeductions: 10000, totalNet: 90000, totalCtc: 106000, createdAt: '2026-04-28' },
  { id: 3, month: 5, year: 2026, status: 'DRAFT', notes: 'May 2026 Payroll', employeeCount: 2, totalGross: 0, totalDeductions: 0, totalNet: 0, totalCtc: 0, createdAt: '2026-05-01' },
];

export const DEMO_PAYSLIP = {
  id: 1,
  employee: { name: 'Ajmayen Fayek', employeeId: 'emp-0001', designation: 'Jr Software Engineer', department: 'Software Development' },
  month: 4, year: 2026,
  earnings: [
    { name: 'Basic Salary', amount: 30000 },
    { name: 'House Rent Allowance', amount: 15000 },
    { name: 'Medical Allowance', amount: 3000 },
    { name: 'Conveyance', amount: 2000 },
  ],
  deductions: [
    { name: 'Employee PF (10% of Basic)', amount: 3000 },
    { name: 'Income Tax', amount: 2000 },
  ],
  employerContributions: [
    { name: 'Employer PF (10% of Basic)', amount: 3000 },
  ],
  grossSalary: 50000,
  totalDeductions: 5000,
  netSalary: 45000,
  employerContributionsTotal: 3000,
  ctc: 53000,
};
