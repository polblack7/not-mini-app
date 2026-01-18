import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { LineChart } from "../components/LineChart";
import { downloadBlob } from "../utils/download";

const ReportsPage = () => {
  const [ops, setOps] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({ from: "", to: "", pair: "", dex: "" });

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.from) params.set("from", new Date(filters.from).toISOString());
    if (filters.to) params.set("to", new Date(filters.to).toISOString());
    if (filters.pair) params.set("pair", filters.pair);
    if (filters.dex) params.set("dex", filters.dex);
    const query = params.toString();
    return query ? `?${query}` : "";
  }, [filters]);

  const load = async () => {
    const [opsData, summaryData] = await Promise.all([
      api.ops(queryParams),
      api.statsSummary(queryParams)
    ]);
    setOps(opsData);
    setSummary(summaryData);
  };

  useEffect(() => {
    load();
  }, [queryParams]);

  const profitSeries = ops
    .slice()
    .reverse()
    .map((op, index) => ({ x: index, y: op.profit }));

  const successSeries = ops
    .slice()
    .reverse()
    .map((op, index) => ({ x: index, y: op.status === "success" ? 1 : 0 }));

  const exportCsv = async () => {
    const blob = await api.exportCsv(queryParams);
    downloadBlob(blob, "ops.csv");
  };

  const exportJson = async () => {
    const blob = await api.exportJson(queryParams);
    downloadBlob(blob, "ops.json");
  };

  return (
    <div className="reports">
      <section className="card filter-bar">
        <h2>Statistics & reports</h2>
        <div className="filters">
          <div className="field">
            <label>Date from</label>
            <input
              type="date"
              value={filters.from}
              onChange={(event) => setFilters({ ...filters, from: event.target.value })}
            />
          </div>
          <div className="field">
            <label>Date to</label>
            <input
              type="date"
              value={filters.to}
              onChange={(event) => setFilters({ ...filters, to: event.target.value })}
            />
          </div>
          <div className="field">
            <label>Token / pair</label>
            <input
              value={filters.pair}
              onChange={(event) => setFilters({ ...filters, pair: event.target.value })}
              placeholder="ETH/USDT"
            />
          </div>
          <div className="field">
            <label>DEX</label>
            <input
              value={filters.dex}
              onChange={(event) => setFilters({ ...filters, dex: event.target.value })}
              placeholder="Uniswap"
            />
          </div>
        </div>
        <div className="filter-actions">
          <button className="ghost" onClick={() => setFilters({ from: "", to: "", pair: "", dex: "" })}>
            Reset
          </button>
          <button className="ghost" onClick={exportCsv}>
            Export CSV
          </button>
          <button className="ghost" onClick={exportJson}>
            Export JSON
          </button>
        </div>
      </section>

      <section className="summary-grid">
        <div className="card">
          <p className="kpi-label">Total profit</p>
          <h3>{summary ? `${summary.total_profit.toFixed(4)} ETH` : "--"}</h3>
        </div>
        <div className="card">
          <p className="kpi-label">Success rate</p>
          <h3>{summary ? `${(summary.success_rate * 100).toFixed(1)}%` : "--"}</h3>
        </div>
        <div className="card">
          <p className="kpi-label">Avg profitability</p>
          <h3>{summary ? `${summary.avg_profitability.toFixed(4)} ETH` : "--"}</h3>
        </div>
      </section>

      <section className="chart-grid">
        <LineChart title="Profit over time" points={profitSeries} formatValue={(v) => `${v.toFixed(3)} ETH`} />
        <LineChart title="Success rate" points={successSeries} formatValue={(v) => `${(v * 100).toFixed(0)}%`} />
      </section>

      <section className="card table-card">
        <h3>Operations</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Pair / route</th>
                <th>Profit</th>
                <th>Fees</th>
                <th>Exec time</th>
                <th>Status</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {ops.map((op) => (
                <tr key={op.id || `${op.timestamp}-${op.pair}`}>
                  <td>{new Date(op.timestamp).toLocaleString()}</td>
                  <td>{op.pair}</td>
                  <td className={op.profit >= 0 ? "positive" : "negative"}>{op.profit.toFixed(4)}</td>
                  <td>{op.fees.toFixed(4)}</td>
                  <td>{op.exec_time_ms} ms</td>
                  <td>{op.status}</td>
                  <td>{op.error_message || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ReportsPage;
