import React from "react";
import { cn } from "../../utils/cn";
import { BOT_STATUS } from "../../constants/status";

export const StatusDot = ({ state = BOT_STATUS.STOPPED }) => (
  <span className={cn("status-dot", `status-dot--${state}`)}>
    <span className="status-dot__core" />
  </span>
);
