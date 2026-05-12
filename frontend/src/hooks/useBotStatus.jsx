import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { api } from "../api/client";
import { BOT_STATUS } from "../constants/status";
import { useAuth } from "./useAuth";
import { usePolling } from "./usePolling";

const BotStatusContext = createContext(null);

const POLL_MS = 4200;

export const BotStatusProvider = ({ children }) => {
  const { token } = useAuth();
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!token) return null;
    try {
      const data = await api.botStatus();
      setStatus(data);
      setError(null);
      return data;
    } catch (err) {
      setError(err?.message || "Failed to load status");
      return null;
    }
  }, [token]);

  usePolling(refresh, POLL_MS, Boolean(token));

  const value = useMemo(
    () => ({
      status,
      error,
      refresh,
      setStatus,
      isActive: status?.status === BOT_STATUS.ACTIVE,
      hasError: Boolean(status?.last_error) || status?.status === BOT_STATUS.ERROR,
    }),
    [status, error, refresh]
  );

  return <BotStatusContext.Provider value={value}>{children}</BotStatusContext.Provider>;
};

export function useBotStatus() {
  const ctx = useContext(BotStatusContext);
  if (!ctx) {
    throw new Error("useBotStatus must be used within BotStatusProvider");
  }
  return ctx;
}
