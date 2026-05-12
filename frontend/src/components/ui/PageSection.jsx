import React from "react";
import { cn } from "../../utils/cn";

/**
 * Page gutter wrapper. Replaces the inline `style={{ padding: "20px 24px 0" }}`
 * pattern. `gap` controls top spacing: "lg" (20px) | "md" (16px).
 */
export const PageSection = ({ gap = "lg", className, children }) => (
  <div className={cn("page-section", `page-section--${gap}`, className)}>{children}</div>
);
