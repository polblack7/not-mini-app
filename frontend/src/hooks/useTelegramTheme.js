import { useEffect } from "react";

const THEME_KEYS = {
  bg_color: "--tg-bg",
  text_color: "--tg-text",
  button_color: "--tg-accent",
  button_text_color: "--tg-accent-text",
  hint_color: "--tg-muted",
  link_color: "--tg-link",
  secondary_bg_color: "--tg-surface",
  header_bg_color: "--tg-header"
};

function applyTheme(params) {
  if (!params) return;
  const root = document.documentElement;
  Object.entries(THEME_KEYS).forEach(([key, cssVar]) => {
    const value = params[key];
    if (value) {
      root.style.setProperty(cssVar, value);
    }
  });
}

function applyViewport(telegram) {
  if (!telegram) return;
  const root = document.documentElement;
  const stableHeight =
    telegram.viewportStableHeight || telegram.viewportHeight || window.innerHeight;
  if (stableHeight) {
    root.style.setProperty("--tg-viewport-height", `${stableHeight}px`);
  }
}

export function useTelegramTheme() {
  useEffect(() => {
    const telegram = (window.Telegram && window.Telegram.WebApp) || window.TelegramWebApp;
    if (!telegram) return;

    telegram.ready && telegram.ready();
    telegram.expand && telegram.expand();
    telegram.requestTheme && telegram.requestTheme();

    applyTheme(telegram.initDataUnsafe && telegram.initDataUnsafe.theme_params);
    applyViewport(telegram);
    telegram.onEvent && telegram.onEvent("theme_changed", () => {
      applyTheme(telegram.initDataUnsafe && telegram.initDataUnsafe.theme_params);
    });
    telegram.onEvent && telegram.onEvent("viewport_changed", () => {
      applyViewport(telegram);
    });
  }, []);
}

export function getTelegramUserId() {
  const telegram = (window.Telegram && window.Telegram.WebApp) || window.TelegramWebApp;
  return telegram && telegram.initDataUnsafe && telegram.initDataUnsafe.user
    ? telegram.initDataUnsafe.user.id
    : undefined;
}
