import React from "react";

export const Field = ({ label, children, hint, error }) => (
  <div className="field">
    {label && <label className="field__label">{label}</label>}
    {children}
    {error && <span className="field__hint field__hint--error">{error}</span>}
    {!error && hint && <span className="field__hint">{hint}</span>}
  </div>
);
