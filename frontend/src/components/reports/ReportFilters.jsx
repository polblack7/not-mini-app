import React from "react";
import { Chip } from "../ui/Chip";
import { REPORT_PERIODS } from "../../constants/markets";

export const ReportFilters = ({ filters, onChange }) => {
  const patch = (partial) => onChange({ ...filters, ...partial });

  return (
    <div className="reports-filters">
      <div className="reports-filters__periods">
        {REPORT_PERIODS.map((p) => (
          <Chip
            key={p.key}
            variant="period"
            active={filters.period === p.key}
            onClick={() => patch({ period: p.key })}
          >
            {p.label}
          </Chip>
        ))}
      </div>
    </div>
  );
};
