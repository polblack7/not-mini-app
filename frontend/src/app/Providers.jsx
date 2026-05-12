import React from "react";
import { HashRouter } from "react-router-dom";
import { AuthProvider } from "../hooks/useAuth";
import { BotStatusProvider } from "../hooks/useBotStatus";

export const Providers = ({ children }) => (
  <HashRouter>
    <AuthProvider>
      <BotStatusProvider>{children}</BotStatusProvider>
    </AuthProvider>
  </HashRouter>
);
