import React from "react";
import { Card } from "../ui/Card";
import { Icon } from "../ui/Icon";
import { COLORS } from "../ui/tokens";

const MENU = [
  { label: "Open in Telegram", icon: "telegram", action: "telegram" },
  { label: "Notification settings", icon: "bell", action: "notifications" },
  { label: "Help & docs", icon: "help", action: "help" },
];

export const TelegramBotMenu = ({ onSelect }) => (
  <Card padding="4px 14px">
    {MENU.map((item) => (
      <button
        key={item.action}
        type="button"
        className="menu-row"
        onClick={() => onSelect?.(item.action)}
      >
        <div className="menu-row__icon">
          <Icon name={item.icon} size={16} color={COLORS.primary} />
        </div>
        <span className="menu-row__label">{item.label}</span>
        <Icon name="chevron-right" size={14} color={COLORS.muted} />
      </button>
    ))}
  </Card>
);
