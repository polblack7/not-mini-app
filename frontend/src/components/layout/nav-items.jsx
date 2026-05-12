import React from "react";

const Icon = ({ children }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    {children}
  </svg>
);

const StrokeIcon = ({ children }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const NAV_ITEMS = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: (
      <Icon>
        <path d="M3 3h7v9H3zm0 11h7v7H3zm9-11h9v5h-9zm0 7h9v11h-9z" />
      </Icon>
    ),
  },
  {
    to: "/reports",
    label: "Reports",
    icon: (
      <Icon>
        <path d="M4 4h4v16H4zm6 6h4v10h-4zm6-4h4v14h-4z" />
      </Icon>
    ),
  },
  {
    to: "/settings",
    label: "Strategy",
    icon: (
      <StrokeIcon>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
      </StrokeIcon>
    ),
  },
  {
    to: "/profile",
    label: "Profile",
    icon: (
      <StrokeIcon>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
      </StrokeIcon>
    ),
  },
];
