import axios from "axios";

const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${host}:8000/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
});

function getTokens() {
  return {
    access: localStorage.getItem("access_token"),
    refresh: localStorage.getItem("refresh_token"),
  };
}

function setTokens({ access, refresh }) {
  if (access) localStorage.setItem("access_token", access);
  if (refresh) localStorage.setItem("refresh_token", refresh);
}

function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

// Attach the access token to every outgoing request.
api.interceptors.request.use((config) => {
  const { access } = getTokens();
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// On a 401, try refreshing the access token once, then retry the request.
// This keeps the user signed in through short-lived access tokens without
// interrupting whatever they were doing.
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && !originalRequest._retry) {
      const { refresh } = getTokens();
      if (!refresh) {
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_BASE_URL}/auth/login/refresh/`, { refresh })
            .then((res) => {
              setTokens({ access: res.data.access });
              refreshPromise = null;
              return res.data.access;
            })
            .catch((err) => {
              refreshPromise = null;
              throw err;
            });
        }
        const newAccess = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export function extractErrorMessage(error) {
  const data = error?.response?.data;
  if (!data) return "Something went wrong. Please try again.";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  if (typeof data === "object") {
    const messages = [];
    for (const [key, value] of Object.entries(data)) {
      const msg = Array.isArray(value) ? value.join(" ") : String(value);
      const fieldName = key.replace("_", " ");
      messages.push(`${fieldName}: ${msg}`);
    }
    if (messages.length > 0) return messages.join(" | ");
  }
  return "Something went wrong. Please try again.";
}

export { setTokens, clearTokens, getTokens };
export default api;
