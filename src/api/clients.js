import { axiosInstance } from './axiosInstance';

// ── Admin: Client Management ──────────────────────────────────────────────────

export const getAllClients = (page = 0, size = 10) =>
  axiosInstance.get('/clients', { params: { page, size } });

export const getClientById = (id) =>
  axiosInstance.get(`/clients/${id}`);

export const getNextClientId = () =>
  axiosInstance.get('/clients/next-client-id');

export const createClient = (data) =>
  axiosInstance.post('/clients', data);

export const updateClient = (id, data) =>
  axiosInstance.put(`/clients/${id}`, data);

export const deleteClient = (id) =>
  axiosInstance.delete(`/clients/${id}`);

export const toggleClientStatus = (id, active) =>
  axiosInstance.patch(`/clients/${id}/status`, null, { params: { active } });

// ── Client Self-Service ───────────────────────────────────────────────────────

export const getMyClientProfile = () =>
  axiosInstance.get('/client-profile');

export const updateMyClientProfile = (data) =>
  axiosInstance.put('/client-profile', data);
