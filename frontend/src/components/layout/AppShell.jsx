import React from "react";
import { useBotStatus } from "../../hooks/useBotStatus";
import { AuroraBg } from "./AuroraBg";
import { TabBar } from "./TabBar";
import { NAV_ITEMS } from "./nav-items";

/**
 * Authenticated shell — Aurora background driven by bot status, scrollable main,
 * and the navigation chrome (bottom on mobile, sidebar on desktop).
 */
export const AppShell = ({ children }) => {
  const { isActive, hasError } = useBotStatus();
  return (
    <div className="app-shell">
      <AuroraBg variant="app" active={isActive} error={hasError} />
      <main className="app-main">{children}</main>
      <TabBar items={NAV_ITEMS} />
    </div>
  );
};
