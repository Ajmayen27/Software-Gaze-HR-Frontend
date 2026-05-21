import { axiosInstance } from './axiosInstance';

// ── Support Tickets ───────────────────────────────────────────────────────────

export const getAllTickets = (params = {}) =>
  axiosInstance.get('/support-tickets', { params });

export const getTicketById = (id) =>
  axiosInstance.get(`/support-tickets/${id}`);

export const createTicket = (data) =>
  axiosInstance.post('/support-tickets', data);

// ── Messages ──────────────────────────────────────────────────────────────────

export const getMessages = (id) =>
  axiosInstance.get(`/support-tickets/${id}/messages`);

export const addMessage = (id, data) =>
  axiosInstance.post(`/support-tickets/${id}/messages`, data);

// ── Workflow Actions (Admin/Manager) ─────────────────────────────────────────

export const assignTicket = (id, data) =>
  axiosInstance.patch(`/support-tickets/${id}/assign`, data);

export const resolveTicket = (id, data) =>
  axiosInstance.patch(`/support-tickets/${id}/resolve`, data);

// ── Workflow Actions (Client) ─────────────────────────────────────────────────

export const closeTicket = (id) =>
  axiosInstance.patch(`/support-tickets/${id}/close`);

export const reopenTicket = (id) =>
  axiosInstance.patch(`/support-tickets/${id}/reopen`);
