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

const SAFE_AREA_SIDES = ["top", "right", "bottom", "left"];

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

function applySafeArea(telegram) {
  if (!telegram) return;
  const root = document.documentElement;
  const sys = telegram.safeAreaInset || {};
  const content = telegram.contentSafeAreaInset || {};
  SAFE_AREA_SIDES.forEach((side) => {
    const total = (Number(sys[side]) || 0) + (Number(content[side]) || 0);
    root.style.setProperty(`--tg-safe-${side}`, `${total}px`);
  });
}

function requestFullscreen(telegram) {
  if (!telegram) return;
  if (telegram.expand) {
    telegram.expand();
  }
  if (telegram.requestFullscreen) {
    telegram.requestFullscreen();
  }
}

export function useTelegramTheme() {
  useEffect(() => {
    const telegram = (window.Telegram && window.Telegram.WebApp) || window.TelegramWebApp;
    if (!telegram) return;

    telegram.ready && telegram.ready();
    requestFullscreen(telegram);
    telegram.requestTheme && telegram.requestTheme();
    telegram.disableVerticalSwipes && telegram.disableVerticalSwipes();

    applyTheme(telegram.initDataUnsafe && telegram.initDataUnsafe.theme_params);
    applyViewport(telegram);
    applySafeArea(telegram);
    telegram.onEvent && telegram.onEvent("theme_changed", () => {
      applyTheme(telegram.initDataUnsafe && telegram.initDataUnsafe.theme_params);
    });
    telegram.onEvent && telegram.onEvent("viewport_changed", () => {
      applyViewport(telegram);
      applySafeArea(telegram);
      if (telegram.expand && telegram.isExpanded === false) {
        telegram.expand();
      }
    });
    telegram.onEvent && telegram.onEvent("safe_area_changed", () => applySafeArea(telegram));
    telegram.onEvent && telegram.onEvent("content_safe_area_changed", () => applySafeArea(telegram));
  }, []);
}

export function getTelegramUserId() {
  const telegram = (window.Telegram && window.Telegram.WebApp) || window.TelegramWebApp;
  return telegram && telegram.initDataUnsafe && telegram.initDataUnsafe.user
    ? telegram.initDataUnsafe.user.id
    : undefined;
}
