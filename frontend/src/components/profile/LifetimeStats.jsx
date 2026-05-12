import React from "react";
import { Card } from "../ui/Card";
import { formatDate, formatEth } from "../../utils/format";

const StatRow = ({ label, value }) => (
  <div className="stat-row">
    <span className="stat-row__label">{label}</span>
    <span className="stat-row__value">{value}</span>
  </div>
);

export const LifetimeStats = ({ profile }) => (
  <Card padding="0 16px">
    <StatRow label="Successful trades" value={profile.successful_arbs ?? 0} />
    <StatRow label="Total profit" value={formatEth(profile.total_profit ?? 0)} />
    <StatRow label="Avg profitability" value={formatEth(profile.avg_profitability ?? 0)} />
    <StatRow label="Joined" value={formatDate(profile.created_at)} />
  </Card>
);
