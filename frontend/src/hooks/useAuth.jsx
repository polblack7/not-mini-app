import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, setAuthToken, setOnUnauthorized } from "../api/client";

const TOKEN_KEY = "onearb_token";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY));
  const [profile, setProfileState] = useState(null);

  const login = (nextToken, nextProfile) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    setAuthToken(nextToken);
    setToken(nextToken);
    setProfileState(nextProfile);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    setToken(null);
    setProfileState(null);
  };

  const setProfile = (nextProfile) => {
    setProfileState(nextProfile);
  };

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  useEffect(() => {
    setOnUnauthorized(logout);
    return () => setOnUnauthorized(null);
  }, []);

  useEffect(() => {
    if (!token || profile) return;
    api.me().then(setProfileState).catch(() => null);
  }, [token, profile]);

  const value = useMemo(
    () => ({ token, profile, login, logout, setProfile }),
    [token, profile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
