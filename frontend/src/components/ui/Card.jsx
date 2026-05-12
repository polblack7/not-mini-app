import React from "react";
import { cn } from "../../utils/cn";

export const Card = ({ children, padding, className, style }) => (
  <div
    className={cn("card", className)}
    style={padding !== undefined ? { padding, ...(style || {}) } : style}
  >
    {children}
  </div>
);
