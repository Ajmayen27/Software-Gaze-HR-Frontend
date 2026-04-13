import { axiosInstance } from './axiosInstance';

// Helper: safely extract array from any response shape
const toArray = (res) => {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  if (res && Array.isArray(res.content)) return res.content;
  if (res && res.data && Array.isArray(res.data.content)) return res.data.content;
  return [];
};

export const LookupService = {
  getDepartments: async () => toArray(await axiosInstance.get('/departments')),
  getDesignations: async (departmentId = null) => {
    const url = departmentId ? `/designations?departmentId=${departmentId}` : '/designations';
    return toArray(await axiosInstance.get(url));
  },
  getLocations: async () => toArray(await axiosInstance.get('/locations')),
  getShifts: async () => toArray(await axiosInstance.get('/shifts')),
  getSalaryGroups: async () => toArray(await axiosInstance.get('/salary-groups')),
  
  fetchAllLookups: async () => {
    const [departments, designations, locations, shifts, salaryGroups] = await Promise.all([
      LookupService.getDepartments(),
      LookupService.getDesignations(),
      LookupService.getLocations(),
      LookupService.getShifts(),
      LookupService.getSalaryGroups(),
    ]);

    return { departments, designations, locations, shifts, salaryGroups };
  }
};
