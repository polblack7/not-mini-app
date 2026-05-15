/**
 * Design tokens accessible from JS (SVG strokes, inline styles).
 * For most cases prefer CSS variables — these are only for code that
 * truly needs the raw value (e.g. SVG fill/stroke attributes).
 */
export const COLORS = Object.freeze({
  bg: "#070707",
  bg1: "#121212",
  bg2: "#212125",
  bg3: "#1D1D1D",
  primary: "#6552FE",
  accentViolet: "#9D50FF",
  success: "#48D49E",
  danger: "#FF8266",
  warning: "#F2AF1A",
  info: "#326CF9",
  fg: "#FFFFFF",
  muted: "#B9C1D9",
  dim: "#8F899F",
});

export const TINT = Object.freeze({
  success: "rgba(72,212,158,0.12)",
  danger: "rgba(255,130,102,0.12)",
  primary: "rgba(101,82,254,0.15)",
  info: "rgba(50,108,249,0.12)",
  dim: "rgba(143,137,159,0.12)",
});
