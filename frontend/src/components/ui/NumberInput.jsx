import React from "react";

export const NumberInput = ({ value, onChange, suffix, step = 0.1, min }) => (
  <div className="num-input">
    <input
      type="number"
      step={step}
      min={min}
      value={value ?? ""}
      onChange={(e) => onChange(Number(e.target.value))}
    />
    {suffix && <span className="num-input__suffix">{suffix}</span>}
  </div>
);
