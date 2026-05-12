import React from "react";
import { Card } from "../ui/Card";
import { MiniChart } from "../ui/MiniChart";
import { COLORS } from "../ui/tokens";

export const ChartCard = ({ title, value, valueTone = "success", points, stroke, fill }) => (
  <Card padding={16}>
    <header className="chart-card__head">
      <span className="chart-card__title">{title}</span>
      <span
        className="chart-card__value"
        style={{ color: valueTone === "success" ? COLORS.success : COLORS.fg }}
      >
        {value}
      </span>
    </header>
    <MiniChart points={points} stroke={stroke} fill={fill} />
  </Card>
);
