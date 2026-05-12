import React, { useId } from "react";
import { COLORS } from "./tokens";

/**
 * Compact SVG sparkline with gradient fill underneath the stroke.
 * Used by Reports for cumulative profit + success rate charts.
 */
export const MiniChart = ({ points, stroke = COLORS.primary, fill = COLORS.primary }) => {
  const gradientId = useId();
  if (!points?.length) {
    return <div className="mini-chart mini-chart--empty">No data</div>;
  }

  const W = 260;
  const H = 80;
  const P = 6;
  const ys = points.map((p) => p.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const span = maxY - minY || 1;
  const sx = (i) => P + (i / Math.max(1, points.length - 1)) * (W - P * 2);
  const sy = (y) => H - P - ((y - minY) / span) * (H - P * 2);

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${sx(i).toFixed(1)} ${sy(p.y).toFixed(1)}`)
    .join(" ");
  const area = `${path} L ${sx(points.length - 1).toFixed(1)} ${H} L ${sx(0).toFixed(1)} ${H} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="mini-chart"
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={fill} stopOpacity="0.5" />
          <stop offset="1" stopColor={fill} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={path} stroke={stroke} strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
};
