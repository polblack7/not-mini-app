import React from "react";
import { cn } from "../../utils/cn";

export const SectionLabel = ({ children, action }) => (
  <div className="section-label">
    <div className="section-label__title">{children}</div>
    {action}
  </div>
);

/**
 * Vertically-spaced section with optional title + action. Use inside
 * <PageSection> for proper gutters.
 */
export const Section = ({ title, action, children, className, strip = false }) => (
  <section className={cn("section", strip && "section--strip", className)}>
    {(title || action) && <SectionLabel action={action}>{title}</SectionLabel>}
    {children}
  </section>
);
