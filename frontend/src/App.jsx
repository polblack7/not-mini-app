import React from "react";
import { useTelegramTheme } from "./hooks/useTelegramTheme";
import { AppRoutes } from "./app/routes";

const App = () => {
  useTelegramTheme();
  return <AppRoutes />;
};

export default App;
