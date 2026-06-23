import { axiosInstance } from './axiosInstance';

/**
 * Expense API Service
 * Base: /api/v1/expenses
 * All endpoints require: Authorization: Bearer <access_token>
 */
export const ExpenseService = {
  // ── Expense CRUD ──────────────────────────────────────────────────────────

  /**
   * GET /expenses
   * @param {Object} params - { startDate, endDate, tag, billType, page, size, sortBy, sortDir }
   */
  getExpenses: (params = {}) =>
    axiosInstance.get('/expenses', { params }),

  /**
   * GET /expenses/{id}
   */
  getExpense: (id) =>
    axiosInstance.get(`/expenses/${id}`),

  /**
   * POST /expenses
   * Supports multipart/form-data (optional file upload)
   * @param {FormData|Object} data
   */
  createExpense: (data) => {
    const isFormData = data instanceof FormData;
    return axiosInstance.post('/expenses', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
  },

  /**
   * PUT /expenses/{id}
   * Supports multipart/form-data (optional file upload)
   * @param {number} id
   * @param {FormData|Object} data
   */
  updateExpense: (id, data) => {
    const isFormData = data instanceof FormData;
    return axiosInstance.put(`/expenses/${id}`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
  },

  /**
   * DELETE /expenses/{id}
   */
  deleteExpense: (id) =>
    axiosInstance.delete(`/expenses/${id}`),

  // ── Transaction Slip ──────────────────────────────────────────────────────

  /**
   * GET /expenses/{id}/slip
   * Returns raw file bytes (blob)
   */
  downloadSlip: (id) =>
    axiosInstance.get(`/expenses/${id}/slip`, { responseType: 'blob' }),

  /**
   * DELETE /expenses/{id}/slip
   * Deletes only the transaction slip, keeps the expense record
   */
  deleteSlip: (id) =>
    axiosInstance.delete(`/expenses/${id}/slip`),

  // ── Summary ───────────────────────────────────────────────────────────────

  /**
   * GET /expenses/summary
   * @param {Object} params - { startDate, endDate, tag, billType }
   */
  getSummary: (params = {}) =>
    axiosInstance.get('/expenses/summary', { params }),

  /**
   * GET /expenses/summary/current-month
   * @param {Object} params - { tag, billType }
   */
  getCurrentMonthSummary: (params = {}) =>
    axiosInstance.get('/expenses/summary/current-month', { params }),

  /**
   * GET /expenses/summary/current-year
   * @param {Object} params - { tag, billType }
   */
  getCurrentYearSummary: (params = {}) =>
    axiosInstance.get('/expenses/summary/current-year', { params }),

  // ── Reports (PDF export, returns blob) ────────────────────────────────────

  /**
   * GET /expenses/reports/daily
   * @param {Object} params - { date (required), tag, billType }
   */
  exportDailyReport: (params = {}) =>
    axiosInstance.get('/expenses/reports/daily', { params, responseType: 'blob' }),

  /**
   * GET /expenses/reports/monthly
   * @param {Object} params - { year, month, tag, billType }
   */
  exportMonthlyReport: (params = {}) =>
    axiosInstance.get('/expenses/reports/monthly', { params, responseType: 'blob' }),

  /**
   * GET /expenses/reports/yearly
   * @param {Object} params - { year, tag, billType }
   */
  exportYearlyReport: (params = {}) =>
    axiosInstance.get('/expenses/reports/yearly', { params, responseType: 'blob' }),

  /**
   * GET /expenses/reports/current-month
   * @param {Object} params - { tag, billType }
   */
  exportCurrentMonthReport: (params = {}) =>
    axiosInstance.get('/expenses/reports/current-month', { params, responseType: 'blob' }),

  /**
   * GET /expenses/reports/current-year
   * @param {Object} params - { tag, billType }
   */
  exportCurrentYearReport: (params = {}) =>
    axiosInstance.get('/expenses/reports/current-year', { params, responseType: 'blob' }),

  /**
   * GET /expenses/reports/range
   * @param {Object} params - { startDate, endDate, tag, billType }
   */
  exportRangeReport: (params = {}) =>
    axiosInstance.get('/expenses/reports/range', { params, responseType: 'blob' }),
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Trigger a browser download for a Blob response.
 * @param {Blob} blob
 * @param {string} filename
 */
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Open a Blob in a new browser tab (for PDFs / images).
 * @param {Blob} blob
 */
export const openBlobInTab = (blob) => {
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank');
  // Revoke after a short delay to allow the tab to load
  setTimeout(() => window.URL.revokeObjectURL(url), 10000);
};

export const TAG_OPTIONS = ['Paid', 'Unpaid', 'Due'];

export const TAG_BADGE_CLASS = {
  Paid: 'badge-success',
  Unpaid: 'badge-warning',
  Due: 'badge-danger',
};
