import React from "react";
import { cn } from "../../utils/cn";

export const PrimaryButton = ({
  children,
  onClick,
  disabled,
  block,
  size = "md",
  type = "button",
  glow = true,
  className,
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "btn-primary",
      block && "btn-primary--block",
      size === "sm" && "btn-primary--sm",
      className
    )}
    style={!glow ? { boxShadow: "none" } : undefined}
  >
    {children}
  </button>
);

export const OutlineButton = ({ children, onClick, tone = "default", className }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn("btn-outline", tone === "danger" && "btn-outline--danger", className)}
  >
    {children}
  </button>
);

export const ChipButton = ({ children, onClick, className }) => (
  <button type="button" onClick={onClick} className={cn("btn-chip", className)}>
    {children}
  </button>
);

export const IconButton = ({ children, onClick, ariaLabel, className }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    className={cn("icon-btn", className)}
  >
    {children}
  </button>
);
