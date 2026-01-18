import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { useAuth } from "./hooks/useAuth";
import { useTelegramTheme } from "./hooks/useTelegramTheme";
import ConnectPage from "./pages/Connect";
import DashboardPage from "./pages/Dashboard";
import ProfilePage from "./pages/Profile";
import ReportsPage from "./pages/Reports";
import SettingsPage from "./pages/Settings";

const RequireAuth = ({ children }) => {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/connect" replace />;
  }
  return <Layout>{children}</Layout>;
};

const App = () => {
  useTelegramTheme();

  return (
    <Routes>
      <Route path="/connect" element={<ConnectPage />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/settings"
        element={
          <RequireAuth>
            <SettingsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/reports"
        element={
          <RequireAuth>
            <ReportsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
