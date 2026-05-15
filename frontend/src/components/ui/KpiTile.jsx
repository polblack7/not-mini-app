import React from "react";
import { cn } from "../../utils/cn";

export const KpiTile = ({ label, value, sub, tone = "default" }) => (
  <div className="kpi-tile">
    <div className="kpi-tile__label">{label}</div>
    <div className="kpi-tile__value">{value}</div>
    {sub && (
      <div className={cn("kpi-tile__sub", tone === "success" && "kpi-tile__sub--success")}>
        {sub}
      </div>
    )}
  </div>
);
