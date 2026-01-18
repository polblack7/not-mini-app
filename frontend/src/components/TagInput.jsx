import React, { useState } from "react";

export const TagInput = ({ label, values, onChange, placeholder }) => {
  const [input, setInput] = useState("");

  const addValue = () => {
    const trimmed = input.trim();
    if (!trimmed || values.includes(trimmed)) return;
    onChange([...values, trimmed]);
    setInput("");
  };

  const removeValue = (value) => {
    onChange(values.filter((item) => item !== value));
  };

  return (
    <div className="field">
      <label>{label}</label>
      <div className="tag-input">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addValue();
            }
          }}
          placeholder={placeholder}
        />
        <button type="button" onClick={addValue} className="ghost">
          Add
        </button>
      </div>
      <div className="tag-list">
        {values.map((value) => (
          <span key={value} className="tag">
            {value}
            <button type="button" onClick={() => removeValue(value)} aria-label={`Remove ${value}`}>
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};
