import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./RequireAuth";
import ConnectPage from "../pages/Connect";
import DashboardPage from "../pages/Dashboard";
import ProfilePage from "../pages/Profile";
import ReportsPage from "../pages/Reports";
import SettingsPage from "../pages/Settings";

const authed = (element) => <RequireAuth>{element}</RequireAuth>;

export const AppRoutes = () => (
  <Routes>
    <Route path="/connect" element={<ConnectPage />} />
    <Route path="/dashboard" element={authed(<DashboardPage />)} />
    <Route path="/settings" element={authed(<SettingsPage />)} />
    <Route path="/reports" element={authed(<ReportsPage />)} />
    <Route path="/profile" element={authed(<ProfilePage />)} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);
