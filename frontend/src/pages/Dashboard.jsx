import React, { useCallback, useMemo, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { useBotStatus } from "../hooks/useBotStatus";
import { usePolling } from "../hooks/usePolling";
import { formatNumber, formatPct } from "../utils/format";
import {
  COLORS,
  KpiTile,
  NoticeSlot,
  PageSection,
  Pill,
  Section,
} from "../components/ui";
import {
  DashboardHeader,
  HeroBalance,
  LogList,
  NotificationList,
  OpportunitiesStrip,
} from "../components/dashboard";

const FEED_INTERVAL_MS = 4200;
const NOTIFICATIONS_LIMIT = 6;
const LOGS_LIMIT = 6;

const safe = (promise) => promise.catch(() => null);

const KpiRow = ({ status }) => {
  const kpis = status?.kpis;
  return (
    <div className="kpi-row">
      <KpiTile label="Deals" value={kpis?.completed_deals ?? "—"} sub="last 24h" />
      <KpiTile
        label="Avg profit"
        value={formatNumber(kpis?.avg_profitability)}
        sub="ETH / deal"
        tone="success"
      />
      <KpiTile
        label="Success"
        value={kpis?.success_rate != null ? formatPct(kpis.success_rate) : "—"}
        sub="rate"
        tone="success"
      />
    </div>
  );
};

const LivePill = () => (
  <Pill color={COLORS.success} bg="rgba(72,212,158,0.12)">
    <span className="pill__dot" />
    Live
  </Pill>
);

export default function DashboardPage() {
  const { profile } = useAuth();
  const { status, refresh, setStatus } = useBotStatus();
  const [opportunities, setOpportunities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);

  const loadFeeds = useCallback(async () => {
    try {
      const [opps, notifs, lg] = await Promise.all([
        safe(api.marketOpportunities()),
        safe(api.notifications(NOTIFICATIONS_LIMIT)),
        safe(api.logs(LOGS_LIMIT)),
      ]);
      setOpportunities(opps || []);
      setNotifications(notifs || []);
      setLogs(lg || []);
      setError(null);
    } catch (err) {
      setError(err?.message || "Failed to load");
    }
  }, []);

  usePolling(loadFeeds, FEED_INTERVAL_MS);

  const unread = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const startBot = async () => {
    const res = await api.startBot();
    if (res) setStatus(res);
    refresh();
  };

  const stopBot = async () => {
    const res = await api.stopBot();
    if (res) setStatus(res);
    refresh();
  };

  const markAllRead = async () => {
    const ids = notifications.filter((n) => !n.read && n.id).map((n) => n.id);
    if (!ids.length) return;
    await api.markNotifications(ids);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const errorMessage = status?.last_error || error;

  return (
    <>
      <DashboardHeader walletAddress={profile?.wallet_address} unreadCount={unread} />
      <HeroBalance status={status} onStart={startBot} onStop={stopBot} />
      <KpiRow status={status} />

      <Section strip title="Live Opportunities" action={<LivePill />}>
        <OpportunitiesStrip items={opportunities} />
      </Section>

      <Section
        title={
          <>
            Notifications{" "}
            {unread > 0 && (
              <span style={{ color: COLORS.primary, fontSize: 14, fontWeight: 600 }}>
                · {unread}
              </span>
            )}
          </>
        }
        action={
          <button type="button" className="link-action" onClick={markAllRead}>
            Mark all read
          </button>
        }
      >
        <NotificationList items={notifications} />
      </Section>

      <Section
        title="System logs"
        action={<span style={{ fontSize: 12, color: COLORS.muted }}>Live</span>}
      >
        <LogList items={logs} />
      </Section>

      {errorMessage && (
        <PageSection gap="md">
          <NoticeSlot notice={{ kind: "error", message: errorMessage }} />
        </PageSection>
      )}
    </>
  );
}
