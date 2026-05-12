import React, { useMemo, useState } from "react";
import { api } from "../api/client";
import { REPORT_PERIODS } from "../constants/markets";
import { OP_STATUS } from "../constants/status";
import { useApi } from "../hooks/useApi";
import { downloadBlob } from "../utils/download";
import { formatNumber, formatPct } from "../utils/format";
import {
  ChipButton,
  COLORS,
  KpiTile,
  PageHeader,
  PageSection,
  Section,
} from "../components/ui";
import { ChartCard, OpList, ReportFilters } from "../components/reports";

const DEFAULT_FILTERS = { period: "7d", pair: "", dex: "" };

const buildQuery = ({ period, pair, dex }) => {
  const params = new URLSearchParams();
  const selected = REPORT_PERIODS.find((p) => p.key === period);
  if (selected?.hours) {
    const from = new Date(Date.now() - selected.hours * 3600 * 1000).toISOString();
    params.set("from", from);
  }
  if (pair) params.set("pair", pair);
  if (dex) params.set("dex", dex);
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

  const opsList = ops || [];
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

  const exportFile = async (kind) => {
    const blob = await (kind === "csv" ? api.exportCsv(query) : api.exportJson(query));
    downloadBlob(blob, `ops.${kind}`);
  };

  const headerActions = (
    <div className="report-actions">
      <ChipButton onClick={() => exportFile("csv")}>CSV</ChipButton>
      <ChipButton onClick={() => exportFile("json")}>JSON</ChipButton>
    </div>
  );

  const profitValue = profitSeries.length
    ? `${profitSeries[profitSeries.length - 1].y.toFixed(3)} ETH`
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
          value={formatNumber(summary?.total_profit, 3)}
          sub="ETH"
          tone="success"
        />
        <KpiTile
          label="Success"
          value={formatPct(summary?.success_rate ?? 0)}
          sub={`${successes}/${opsList.length}`}
        />
        <KpiTile
          label="Avg / deal"
          value={formatNumber(summary?.avg_profitability)}
          sub="ETH"
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
