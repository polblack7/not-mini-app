import React, { useMemo, useState } from "react";
import { api, getAuthToken } from "../api/client";
import { REPORT_PERIODS } from "../constants/markets";
import { OP_STATUS } from "../constants/status";
import { useApi } from "../hooks/useApi";
import { downloadFile } from "../utils/download";
import { formatNumber, formatPct, formatUsd } from "../utils/format";
import {
  ChipButton,
  COLORS,
  KpiTile,
  PageHeader,
  PageSection,
  Section,
} from "../components/ui";
import { ChartCard, OpList, ReportFilters } from "../components/reports";

const DEFAULT_FILTERS = { period: "7d" };

const buildQuery = ({ period }) => {
  const params = new URLSearchParams();
  const selected = REPORT_PERIODS.find((p) => p.key === period);
  if (selected?.hours) {
    const from = new Date(Date.now() - selected.hours * 3600 * 1000).toISOString();
    params.set("from", from);
  }
  const q = params.toString();
  return q ? `?${q}` : "";
};

const cumulativeSeries = (ops, picker) =>
  ops
    .slice()
    .reverse()
    .map((_, i, arr) => ({ x: i, y: picker(arr, i) }));

export default function ReportsPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const query = useMemo(() => buildQuery(filters), [filters]);

  const { data: ops } = useApi(() => api.ops(query), [query]);
  const { data: summary } = useApi(() => api.statsSummary(query), [query]);

  // Backend already sorts by timestamp DESC, but sort defensively in case
  // a record sneaks in with a missing/older timestamp (e.g. from seed data).
  const opsList = useMemo(
    () =>
      (ops || [])
        .slice()
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [ops]
  );
  const successes = opsList.filter((o) => o.status === OP_STATUS.SUCCESS).length;

  const profitSeries = useMemo(
    () => cumulativeSeries(opsList, (arr, i) => arr.slice(0, i + 1).reduce((s, o) => s + o.profit, 0)),
    [opsList]
  );

  const successSeries = useMemo(
    () =>
      cumulativeSeries(opsList, (arr, i) => {
        const wins = arr.slice(0, i + 1).filter((o) => o.status === OP_STATUS.SUCCESS).length;
        return wins / (i + 1);
      }),
    [opsList]
  );

  const exportFile = (kind) => {
    const token = getAuthToken();
    if (!token) {
      alert("Not authorized.");
      return;
    }
    // Build a self-authenticated URL: ?token=<jwt> alongside the existing
    // period query. The browser/Telegram external opener follows it,
    // backend authenticates, and Content-Disposition triggers a real download
    // (no blob-URL prompt in mobile WebViews).
    const sep = query ? "&" : "?";
    const path = `/api/export/${kind}${query}${sep}token=${encodeURIComponent(token)}`;
    const url = new URL(path, window.location.origin).toString();
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadFile(url, `ops-${stamp}.${kind}`);
  };

  const headerActions = (
    <div className="report-actions">
      <ChipButton onClick={() => exportFile("csv")}>CSV</ChipButton>
      <ChipButton onClick={() => exportFile("json")}>JSON</ChipButton>
    </div>
  );

  const profitValue = profitSeries.length
    ? formatUsd(profitSeries[profitSeries.length - 1].y)
    : "—";
  const successValue = successSeries.length
    ? formatPct(successSeries[successSeries.length - 1].y)
    : "—";

  return (
    <>
      <PageHeader title="Reports" action={headerActions} />

      <ReportFilters filters={filters} onChange={setFilters} />

      <div className="summary-grid">
        <KpiTile
          label="Total profit"
          value={formatUsd(summary?.total_profit ?? 0)}
          sub="USD"
          tone="success"
        />
        <KpiTile
          label="Success"
          value={formatPct(summary?.success_rate ?? 0)}
          sub={`${successes}/${opsList.length}`}
        />
        <KpiTile
          label="Avg / deal"
          value={formatUsd(summary?.avg_profitability ?? 0)}
          sub="USD"
        />
      </div>

      <PageSection gap="lg" className="charts-stack">
        <ChartCard
          title="Cumulative profit"
          value={profitValue}
          points={profitSeries}
          stroke={COLORS.primary}
          fill={COLORS.primary}
        />
        <ChartCard
          title="Success rate"
          value={successValue}
          points={successSeries}
          stroke={COLORS.success}
          fill={COLORS.success}
        />
      </PageSection>

      <Section
        title="Operations"
        action={<span style={{ fontSize: 12, color: COLORS.muted }}>{opsList.length} ops</span>}
      >
        <OpList ops={opsList} />
      </Section>
    </>
  );
}
