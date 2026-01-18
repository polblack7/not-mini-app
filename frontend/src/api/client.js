/**
 * @typedef {import("./types").ApiError} ApiError
 * @typedef {import("./types").BotStatus} BotStatus
 * @typedef {import("./types").LoginResponse} LoginResponse
 * @typedef {import("./types").LogEntry} LogEntry
 * @typedef {import("./types").Notification} Notification
 * @typedef {import("./types").OpRecord} OpRecord
 * @typedef {import("./types").Opportunity} Opportunity
 * @typedef {import("./types").Profile} Profile
 * @typedef {import("./types").Settings} Settings
 * @typedef {import("./types").StatsSummary} StatsSummary
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

let authToken = null;
let onUnauthorized = null;

export function setAuthToken(token) {
  authToken = token;
}

export function setOnUnauthorized(handler) {
  onUnauthorized = handler;
}

class ApiClientError extends Error {
  /** @param {ApiError} error */
  constructor(error) {
    super(error.message);
    this.code = error.code;
  }
}

/**
 * @template T
 * @param {string} path
 * @param {RequestInit} [options]
 * @returns {Promise<T>}
 */
async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    onUnauthorized && onUnauthorized();
  }

  const payload = await response.json();
  if (!payload.ok) {
    throw new ApiClientError(payload.error || { code: "UNKNOWN", message: "Unknown error" });
  }
  return payload.data;
}

/** @param {string} path */
async function download(path) {
  const headers = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  const response = await fetch(`${API_BASE}${path}`, { headers });
  if (response.status === 401) {
    onUnauthorized && onUnauthorized();
  }
  return await response.blob();
}

export const api = {
  /** @returns {Promise<LoginResponse>} */
  async login(wallet_address, access_token, telegram_user_id) {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ wallet_address, access_token, telegram_user_id })
    });
  },
  /** @returns {Promise<Profile>} */
  async me() {
    return request("/me");
  },
  /** @returns {Promise<Settings>} */
  async getSettings() {
    return request("/settings");
  },
  /** @returns {Promise<Settings>} */
  async updateSettings(payload) {
    return request("/settings", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  },
  async startBot() {
    return request("/bot/start", { method: "POST" });
  },
  async stopBot() {
    return request("/bot/stop", { method: "POST" });
  },
  /** @returns {Promise<BotStatus>} */
  async botStatus() {
    return request("/bot/status");
  },
  /** @returns {Promise<OpRecord[]>} */
  async ops(params) {
    return request(`/ops${params}`);
  },
  /** @returns {Promise<StatsSummary>} */
  async statsSummary(params) {
    return request(`/stats/summary${params}`);
  },
  async exportCsv(params) {
    return download(`/export/csv${params}`);
  },
  async exportJson(params) {
    return download(`/export/json${params}`);
  },
  /** @returns {Promise<Notification[]>} */
  async notifications(limit = 20) {
    return request(`/notifications?limit=${limit}`);
  },
  async markNotifications(ids) {
    return request("/notifications/read", {
      method: "POST",
      body: JSON.stringify({ ids })
    });
  },
  /** @returns {Promise<LogEntry[]>} */
  async logs(limit = 12) {
    return request(`/logs/recent?limit=${limit}`);
  },
  async marketAnalysis() {
    return request("/market/analysis");
  },
  /** @returns {Promise<Opportunity[]>} */
  async marketOpportunities() {
    return request("/market/opportunities");
  }
};

export { ApiClientError };
