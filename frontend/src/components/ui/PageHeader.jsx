import React from "react";

/**
 * Top-of-page header: title + optional eyebrow string or right-aligned action.
 * Replaces the inline `<div className="page-header">…` pattern repeated on
 * every page.
 */
export const PageHeader = ({ title, eyebrow, action, subtitle, children }) => (
  <header className="page-header">
    <div className="page-header__lead">
      {title && <h1 className="page-title">{title}</h1>}
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
      {children}
    </div>
    {eyebrow && <span className="page-eyebrow">{eyebrow}</span>}
    {action}
  </header>
);
