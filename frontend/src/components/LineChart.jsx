import React from "react";

export const LineChart = ({ title, points, formatValue }) => {
  if (points.length === 0) {
    return (
      <div className="card chart-card">
        <h3>{title}</h3>
        <p className="muted">No data yet.</p>
      </div>
    );
  }

  const width = 320;
  const height = 120;
  const padding = 12;

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const scaleX = (x) =>
    padding + ((x - minX) / (maxX - minX || 1)) * (width - padding * 2);
  const scaleY = (y) =>
    height - padding - ((y - minY) / (maxY - minY || 1)) * (height - padding * 2);

  const path = points
    .map((point, index) => {
      const x = scaleX(point.x);
      const y = scaleY(point.y);
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  const latest = points[points.length - 1]?.y ?? 0;

  return (
    <div className="card chart-card">
      <div className="panel-header">
        <h3>{title}</h3>
        <span className="panel-meta">{formatValue ? formatValue(latest) : latest.toFixed(2)}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="chart">
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="3" />
      </svg>
    </div>
  );
};
