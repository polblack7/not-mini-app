import React from "react";

/**
 * Tiny stroke/fill icon registry. Add an entry here instead of inlining SVGs.
 * `kind` defaults to "stroke" — set to "fill" for solid glyphs.
 */
const ICONS = {
  // navigation / chrome
  "chevron-left": { kind: "stroke", body: <path d="M15 6l-6 6 6 6" /> },
  "chevron-right": { kind: "stroke", body: <path d="M9 6l6 6-6 6" /> },
  "arrow-right": { kind: "stroke", body: <path d="M5 12h14M13 6l6 6-6 6" /> },
  refresh: {
    kind: "stroke",
    body: (
      <>
        <path d="M23 4v6h-6M1 20v-6h6" />
        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
      </>
    ),
  },
  bell: {
    kind: "stroke",
    body: (
      <>
        <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 01-3.4 0" />
      </>
    ),
  },
  shield: {
    kind: "fill",
    body: <path d="M12 1L3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-4z" />,
  },
  // notification types
  check: { kind: "stroke", body: <path d="M5 13l4 4L19 7" /> },
  bolt: { kind: "stroke", body: <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" /> },
  alert: {
    kind: "stroke",
    body: (
      <path d="M12 9v4m0 4h.01M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    ),
  },
  info: {
    kind: "stroke",
    body: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </>
    ),
  },
  // op rows
  "trend-up": { kind: "fill", body: <path d="M7 14l5-5 5 5" /> },
  "trend-down": { kind: "fill", body: <path d="M7 10l5 5 5-5" /> },
  // profile menu
  telegram: {
    kind: "stroke",
    body: (
      <path d="M21 11.5a8.4 8.4 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.4 8.4 0 01-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 1116.1-3.8z" />
    ),
  },
  help: { kind: "stroke", body: <path d="M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3M12 17h.01" /> },
};

export const Icon = ({
  name,
  size = 16,
  color = "currentColor",
  strokeWidth = 2,
  className,
  style,
}) => {
  const entry = ICONS[name];
  if (!entry) return null;

  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    "aria-hidden": "true",
    className,
    style,
  };
  if (entry.kind === "fill") {
    props.fill = color;
  } else {
    props.fill = "none";
    props.stroke = color;
    props.strokeWidth = strokeWidth;
    props.strokeLinecap = "round";
    props.strokeLinejoin = "round";
  }

  return <svg {...props}>{entry.body}</svg>;
};
