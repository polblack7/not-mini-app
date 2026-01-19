import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/settings", label: "Settings" },
  { to: "/reports", label: "Reports" },
  { to: "/profile", label: "Profile" }
];

export const Layout = ({ children }) => {
  const { profile } = useAuth();
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="brand">ØNE-ARB</p>
          <p className="subtitle">Arbitrage control panel</p>
        </div>
        <div className="wallet-chip">
          {profile?.wallet_address
            ? `${profile.wallet_address.slice(0, 6)}...${profile.wallet_address.slice(-4)}`
            : "No wallet"}
        </div>
      </header>
      <nav className="bottom-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <main className="app-content">{children}</main>
    </div>
  );
};
