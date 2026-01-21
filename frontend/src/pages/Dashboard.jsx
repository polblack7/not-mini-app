import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { LogsPanel } from "../components/LogsPanel";
import { NotificationsPanel } from "../components/NotificationsPanel";

const DashboardPage = () => {
  const [status, setStatus] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadStatus = async () => {
    try {
      const data = await api.botStatus();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load status");
    }
  };

  const loadOpportunities = async () => {
    try {
      const data = await api.marketOpportunities();
      setOpportunities(data);
    } catch (err) {
      setOpportunities([]);
    }
  };

  useEffect(() => {
    loadStatus();
    loadOpportunities();
    const interval = setInterval(loadStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const startBot = async () => {
    await api.startBot();
    loadStatus();
  };

  const stopBot = async () => {
    await api.stopBot();
    loadStatus();
  };

  return (
    <div className="dashboard">
      <section className="card hero">
        <div>
          <p className="eyebrow">Bot status</p>
          <h2 className={`status ${status?.status || "stopped"}`}>{status?.status || "stopped"}</h2>
          {status?.last_error && <p className="status-error">{status.last_error}</p>}
        </div>
        <div className="hero-actions">
          <button className="primary" onClick={startBot}>
            Start bot
          </button>
          <button className="danger" onClick={stopBot}>
            Stop bot
          </button>
          <button className="ghost" onClick={() => navigate("/settings")}>
            Strategy settings
          </button>
        </div>
      </section>

      {error && <div className="alert error">{error}</div>}

      <section className="kpi-grid">
        <div className="card kpi">
          <p className="kpi-label">Current profit</p>
          <h3>{status ? `${status.kpis.current_profit.toFixed(4)} ETH` : "--"}</h3>
        </div>
        <div className="card kpi">
          <p className="kpi-label">Completed deals</p>
          <h3>{status ? status.kpis.completed_deals : "--"}</h3>
        </div>
        <div className="card kpi">
          <p className="kpi-label">Avg profitability</p>
          <h3>{status ? `${status.kpis.avg_profitability.toFixed(4)} ETH` : "--"}</h3>
        </div>
      </section>

      <section className="card opportunity">
        <div className="panel-header">
          <h3>Live opportunities</h3>
          <span className="panel-meta">Mock adapter feed</span>
        </div>
        <div className="opportunity-grid">
          {opportunities.length === 0 ? (
            <p className="muted">No opportunities detected.</p>
          ) : (
            opportunities.map((item) => (
              <div key={item.id} className="opportunity-card">
                <p className="opportunity-pair">{item.pair}</p>
                <p className="muted">{item.dex}</p>
                <p className="opportunity-profit">+{item.expected_profit_pct}%</p>
                <p className="opportunity-score">Liquidity {item.liquidity_score}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="split">
        <NotificationsPanel />
        <LogsPanel />
      </div>
    </div>
  );
};

export default DashboardPage;
