import React from "react";
import { cn } from "../../utils/cn";
import { COLORS, TINT } from "./tokens";

/**
 * Low-level pill with explicit color/bg overrides. Prefer <StatusPill /> for
 * semantic states.
 */
export const Pill = ({ children, color, bg, className }) => {
  const style = {};
  if (color) style.color = color;
  if (bg) {
    style.background = bg;
    style.border = "0";
  }
  return (
    <span className={cn("pill", bg && "pill--filled", className)} style={style}>
      {children}
    </span>
  );
};

const SEMANTIC = {
  success: { color: COLORS.success, bg: TINT.success },
  danger: { color: COLORS.danger, bg: TINT.danger },
  primary: { color: COLORS.primary, bg: TINT.primary },
  info: { color: COLORS.info, bg: TINT.info },
  dim: { color: COLORS.dim, bg: TINT.dim },
};

export const StatusPill = ({ tone = "dim", children, className }) => {
  const t = SEMANTIC[tone] || SEMANTIC.dim;
  return (
    <Pill color={t.color} bg={t.bg} className={className}>
      {children}
    </Pill>
  );
};
