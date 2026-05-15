import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AppShell } from "../components/layout/AppShell";

export const RequireAuth = ({ children }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/connect" replace />;
  return <AppShell>{children}</AppShell>;
};
