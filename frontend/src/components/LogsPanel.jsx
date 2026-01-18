import React, { useEffect, useState } from "react";
import { api } from "../api/client";

export const LogsPanel = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.logs(10).then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <section className="card logs-panel">
      <div className="panel-header">
        <h3>Logs</h3>
        <span className="panel-meta">Recent system events</span>
      </div>
      <div className="panel-list">
        {items.length === 0 ? (
          <p className="muted">No logs available.</p>
        ) : (
          items.map((item) => (
            <div key={item.id || item.created_at} className={`panel-item level-${item.level}`}>
              <div>
                <p className="panel-title">{item.message}</p>
                <p className="panel-message">{item.context ? JSON.stringify(item.context) : ""}</p>
              </div>
              <span className="panel-meta">{new Date(item.created_at).toLocaleTimeString()}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
