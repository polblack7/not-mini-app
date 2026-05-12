import React from "react";
import { Icon } from "../ui/Icon";
import { StatusPill } from "../ui/Pill";
import { COLORS } from "../ui/tokens";

export const OpportunityCard = ({ item }) => {
  const liquidity = Number(item.liquidity_score) || 0;
  return (
    <div className="opp-card">
      <div className="opp-card__top">
        <span className="opp-card__pair">{item.pair}</span>
        <StatusPill tone="success">+{Number(item.expected_profit_pct).toFixed(2)}%</StatusPill>
      </div>
      <div className="opp-card__route">
        <span>{item.buy_dex}</span>
        <Icon name="arrow-right" size={10} color={COLORS.primary} strokeWidth={2.5} />
        <span>{item.sell_dex}</span>
      </div>
      <div className="opp-card__bar">
        <div style={{ width: `${Math.min(100, liquidity * 100)}%` }} />
      </div>
      <div className="opp-card__score">Liquidity {liquidity.toFixed(2)}</div>
    </div>
  );
};
