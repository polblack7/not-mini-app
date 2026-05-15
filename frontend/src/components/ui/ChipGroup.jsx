import React from "react";
import { cn } from "../../utils/cn";
import { Chip } from "./Chip";

/**
 * Renders a group of toggleable chips. Multi-select by default; pass
 * `single` for radio-style selection.
 *
 *   options  — string[] | { value, label }[]
 *   value    — currently selected value(s)
 *   onChange — (next) => void
 */
export const ChipGroup = ({
  options,
  value,
  onChange,
  variant = "dex",
  single = false,
  className,
}) => {
  const items = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );

  const selected = single ? value : Array.isArray(value) ? value : [];
  const isActive = (v) => (single ? selected === v : selected.includes(v));

  const toggle = (v) => {
    if (single) {
      onChange(v);
      return;
    }
    const next = selected.includes(v)
      ? selected.filter((x) => x !== v)
      : [...selected, v];
    onChange(next);
  };

  const groupClass = {
    pair: "pair-chip-group",
    dex: "dex-chip-group",
    period: "chip-group",
  }[variant];

  return (
    <div className={cn(groupClass, className)}>
      {items.map((item) => (
        <Chip
          key={item.value}
          active={isActive(item.value)}
          onClick={() => toggle(item.value)}
          variant={variant}
        >
          {item.label}
        </Chip>
      ))}
    </div>
  );
};
