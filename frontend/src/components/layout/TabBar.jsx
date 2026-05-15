import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "../../utils/cn";

/**
 * Bottom tab bar (mobile) / left sidebar (desktop). Receives a list of
 * { to, label, icon } items so the route table stays the single source of truth.
 */
export const TabBar = ({ items }) => (
  <nav className="tab-bar" aria-label="Primary">
    {items.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) => cn("tab-bar__item", isActive && "is-active")}
      >
        {item.icon}
        <span>{item.label}</span>
      </NavLink>
    ))}
  </nav>
);
