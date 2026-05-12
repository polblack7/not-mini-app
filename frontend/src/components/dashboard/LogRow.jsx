import React from "react";
import { LOG_LEVEL } from "../../constants/status";
import { COLORS } from "../ui/tokens";
import { formatClockTime } from "../../utils/format";

const COLOR_BY_LEVEL = {
  [LOG_LEVEL.ERROR]: COLORS.danger,
  [LOG_LEVEL.WARNING]: COLORS.warning,
  [LOG_LEVEL.INFO]: COLORS.success,
};

export const LogRow = ({ item }) => (
  <div className="log-row">
    <span
      className="log-row__dot"
      style={{ background: COLOR_BY_LEVEL[item.level] || COLORS.success }}
    />
    <span className="log-row__msg">{item.message}</span>
    <span className="log-row__time">{formatClockTime(item.created_at)}</span>
  </div>
);
