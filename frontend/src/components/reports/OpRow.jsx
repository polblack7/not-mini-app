import React from "react";
import { cn } from "../../utils/cn";
import { OP_STATUS } from "../../constants/status";
import { Icon } from "../ui/Icon";
import { COLORS } from "../ui/tokens";
import { formatClockTime, formatSignedUsd, formatUsd } from "../../utils/format";

export const OpRow = ({ op }) => {
  const success = op.status === OP_STATUS.SUCCESS;
  return (
    <div className="op-row">
      <div className="op-row__left">
        <div className={cn("op-row__tile", success ? "op-row__tile--success" : "op-row__tile--error")}>
          <Icon
            name={success ? "trend-up" : "trend-down"}
            size={14}
            color={success ? COLORS.success : COLORS.danger}
          />
        </div>
        <div className="op-row__meta-wrap">
          <div className="op-row__pair">{op.pair}</div>
          <div className="op-row__meta">
            {op.dex} · {formatClockTime(op.timestamp)}
          </div>
        </div>
      </div>
      <div>
        <div className={cn("op-row__profit", op.profit >= 0 ? "op-row__profit--pos" : "op-row__profit--neg")}>
          {formatSignedUsd(op.profit)}
        </div>
        <div className="op-row__detail">
          {op.exec_time_ms}ms · fees {formatUsd(op.fees)}
        </div>
      </div>
    </div>
  );
};
