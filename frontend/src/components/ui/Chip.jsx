import React from "react";
import { cn } from "../../utils/cn";

/**
 * Single toggleable chip. `variant` controls the look:
 *  - "pair"   filled primary when active (white dot)
 *  - "dex"    tinted primary when active (primary dot)
 *  - "period" tinted primary when active (no dot)
 */
export const Chip = ({ active, onClick, variant = "dex", children }) => {
  const cls = {
    pair: ["pair-chip", active && "pair-chip--active"],
    dex: ["dex-chip", active && "dex-chip--active"],
    period: ["chip", active && "is-active"],
  }[variant];

  const dot = variant === "pair" ? "pair-chip__dot" : variant === "dex" ? "dex-chip__dot" : null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(...cls)}
    >
      {active && dot && <span className={dot} />}
      {children}
    </button>
  );
};
