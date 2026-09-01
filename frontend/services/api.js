import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const ACCESS_TOKEN_KEY = "mm_access_token";
const REFRESH_TOKEN_KEY = "mm_refresh_token";

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  set: (access, refresh) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

client.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Queue concurrent requests while a token refresh is in flight, so we don't fire
// multiple refresh calls at once.
let isRefreshing = false;
let pendingQueue = [];

function resolveQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (!error.response) {
      return Promise.reject({ networkError: true, message: "Network error — please check your connection." });
    }

    if (error.response.status === 401 && !original._retry && tokenStore.getRefresh()) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return client(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: tokenStore.getRefresh(),
        });
        tokenStore.set(data.access, tokenStore.getRefresh());
        resolveQueue(null, data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return client(original);
      } catch (refreshError) {
        resolveQueue(refreshError, null);
        tokenStore.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response.status === 403) {
      return Promise.reject({ forbidden: true, message: "You don't have permission to do that." });
    }

    const message = error.response.data?.error?.message || "Something went wrong. Please try again.";
    return Promise.reject({ message, status: error.response.status, raw: error.response.data });
  }
);

// ============================================================
// Auth
// ============================================================
export async function register(payload) {
  const { data } = await client.post("/auth/register/", payload);
  return data;
}

export async function login(username, password) {
  const { data } = await client.post("/auth/login/", { username, password });
  tokenStore.set(data.access, data.refresh);
  return data;
}

export function logout() {
  tokenStore.clear();
}

export async function getProfile() {
  const { data } = await client.get("/me/");
  return data;
}

// ============================================================
// Wallet
// ============================================================
export async function getWallet() {
  const { data } = await client.get("/wallet/");
  return data;
}

export async function getTransactions(page = 1) {
  const { data } = await client.get("/wallet/transactions/", { params: { page } });
  return data;
}

// ============================================================
// Aviator
// ============================================================
export async function getCurrentRound() {
  const { data } = await client.get("/aviator/current-round/");
  return data;
}

export async function getGameHistory() {
  const { data } = await client.get("/aviator/history/");
  return data;
}

export async function getBetHistory(page = 1) {
  const { data } = await client.get("/aviator/my-bets/", { params: { page } });
  return data;
}

export async function placeBet({ amount, requestId, autoCashoutMultiplier }) {
  const { data } = await client.post("/aviator/bet/", {
    amount,
    request_id: requestId,
    auto_cashout_multiplier: autoCashoutMultiplier || null,
  });
  return data;
}

export async function cashOut({ betId, requestId }) {
  const { data } = await client.post("/aviator/cashout/", {
    bet_id: betId,
    request_id: requestId,
  });
  return data;
}

export async function verifyFairness({ serverSeed, serverSeedHash, clientSeed, nonce }) {
  const { data } = await client.post("/aviator/fairness/verify/", {
    server_seed: serverSeed,
    server_seed_hash: serverSeedHash,
    client_seed: clientSeed,
    nonce,
  });
  return data;
}

export default client;
