import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const ACCESS_KEY = "mm_admin_access_token";
const REFRESH_KEY = "mm_admin_refresh_token";
const ADMIN_KEY = "mm_admin_profile";

export const adminTokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  getAdmin: () => {
    const raw = localStorage.getItem(ADMIN_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  set: (access, refresh, admin) => {
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
    if (admin) localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(ADMIN_KEY);
  },
};

const adminClient = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

adminClient.interceptors.request.use((config) => {
  const token = adminTokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let pendingQueue = [];

function resolveQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)));
  pendingQueue = [];
}

function extractErrorMessage(data) {
  if (!data) return "Something went wrong. Please try again.";
  if (typeof data === "string") return data;
  if (data.error?.message) return data.error.message;
  if (data.detail) return data.detail;
  const firstKey = Object.keys(data)[0];
  if (firstKey) {
    const val = data[firstKey];
    if (Array.isArray(val) && typeof val[0] === "string") return val[0];
    if (typeof val === "string") return val;
  }
  return "Something went wrong. Please try again.";
}

adminClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (!error.response) {
      return Promise.reject({ networkError: true, message: "Network error — please check your connection." });
    }

    if (error.response.status === 401 && !original._retry && adminTokenStore.getRefresh()) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => pendingQueue.push({ resolve, reject })).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return adminClient(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: adminTokenStore.getRefresh(),
        });
        adminTokenStore.set(data.access, adminTokenStore.getRefresh());
        resolveQueue(null, data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return adminClient(original);
      } catch (refreshError) {
        resolveQueue(refreshError, null);
        adminTokenStore.clear();
        window.location.href = "/admin/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response.status === 403) {
      adminTokenStore.clear();
      return Promise.reject({ forbidden: true, message: "Admin access only." });
    }

    return Promise.reject({ message: extractErrorMessage(error.response.data), status: error.response.status });
  }
);

// ============================================================
// Auth
// ============================================================
export async function adminLoginStep1(email, password) {
  const { data } = await adminClient.post("/admin/auth/login/", { email, password });
  return data; // { login_token, message }
}

export async function adminVerifyOtp(loginToken, code) {
  const { data } = await adminClient.post("/admin/auth/otp/verify/", { login_token: loginToken, code });
  adminTokenStore.set(data.access, data.refresh, data.admin);
  return data;
}

export async function adminResendOtp(loginToken) {
  const { data } = await adminClient.post("/admin/auth/otp/resend/", { login_token: loginToken });
  return data; // new { login_token, message }
}

export function adminLogout() {
  adminTokenStore.clear();
}

// ============================================================
// Dashboard data
// ============================================================
export async function getAdminStats() {
  const { data } = await adminClient.get("/admin/stats/");
  return data;
}

export async function getAdminUsers({ page = 1, search = "" } = {}) {
  const { data } = await adminClient.get("/admin/users/", { params: { page, search: search || undefined } });
  return data;
}

export async function getAdminTransactions({ page = 1, txType = "", search = "" } = {}) {
  const { data } = await adminClient.get("/admin/transactions/", {
    params: { page, tx_type: txType || undefined, search: search || undefined },
  });
  return data;
}

export async function getAdminRounds({ page = 1 } = {}) {
  const { data } = await adminClient.get("/admin/rounds/", { params: { page } });
  return data;
}

export async function getAdminCurrentRound() {
  const { data } = await adminClient.get("/admin/rounds/current/");
  return data;
}

// ============================================================
// Engine control (pause/resume — see api/models.py EngineControl)
// ============================================================
export async function getEngineStatus() {
  const { data } = await adminClient.get("/admin/engine/status/");
  return data; // { is_paused, paused_by, paused_at, reason }
}

export async function pauseEngine(reason = "") {
  const { data } = await adminClient.post("/admin/engine/pause/", { reason });
  return data; // { success, message, is_paused }
}

export async function resumeEngine() {
  const { data } = await adminClient.post("/admin/engine/resume/");
  return data; // { success, message, is_paused }
}

export default adminClient;