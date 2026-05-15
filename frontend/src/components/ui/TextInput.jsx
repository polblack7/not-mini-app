import React from "react";

export const TextInput = ({
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
}) => (
  <input
    className="text-input"
    type={type}
    value={value ?? ""}
    placeholder={placeholder}
    autoComplete={autoComplete}
    onChange={(e) => onChange(e.target.value)}
  />
);

export const FilterInput = ({ value, onChange, placeholder }) => (
  <input
    className="filter-input"
    value={value ?? ""}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
  />
);
