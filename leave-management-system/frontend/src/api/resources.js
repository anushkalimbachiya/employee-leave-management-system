import api from "./axios";

export const authApi = {
  login: (username, password) => api.post("/auth/login/", { username, password }),
  register: (payload) => api.post("/auth/register/", payload),
  me: () => api.get("/auth/me/"),
  managers: () => api.get("/auth/managers/"),
};

export const leavesApi = {
  list: (params) => api.get("/leaves/requests/", { params }),
  apply: (payload) => api.post("/leaves/requests/", payload),
  cancel: (id) => api.delete(`/leaves/requests/${id}/`),
  decide: (id, payload) => api.post(`/leaves/requests/${id}/decision/`, payload),
  employeeDashboard: () => api.get("/leaves/dashboard/employee/"),
  managerDashboard: () => api.get("/leaves/dashboard/manager/"),
};
