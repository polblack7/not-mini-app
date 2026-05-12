import React from "react";
import { NOTIFICATION_TYPE } from "../../constants/status";
import { Icon } from "../ui/Icon";
import { COLORS, TINT } from "../ui/tokens";
import { timeAgo } from "../../utils/format";

const ICON_BY_TYPE = {
  [NOTIFICATION_TYPE.DEAL]: { bg: TINT.success, color: COLORS.success, icon: "check" },
  [NOTIFICATION_TYPE.OPPORTUNITY]: { bg: TINT.primary, color: COLORS.primary, icon: "bolt" },
  [NOTIFICATION_TYPE.ERROR]: { bg: TINT.danger, color: COLORS.danger, icon: "alert" },
  [NOTIFICATION_TYPE.INFO]: { bg: TINT.info, color: COLORS.info, icon: "info" },
};

export const NotificationRow = ({ item }) => {
  const visual = ICON_BY_TYPE[item.type] || ICON_BY_TYPE[NOTIFICATION_TYPE.INFO];
  return (
    <div className="notif-row">
      <div className="notif-row__icon" style={{ background: visual.bg }}>
        <Icon name={visual.icon} size={16} color={visual.color} />
      </div>
      <div className="notif-row__body">
        <div className="notif-row__title">
          <span>{item.title}</span>
          {!item.read && <span className="unread-dot" />}
        </div>
        <div className="notif-row__msg">{item.message}</div>
      </div>
      <div className="notif-row__time">{timeAgo(item.created_at)}</div>
    </div>
  );
};
