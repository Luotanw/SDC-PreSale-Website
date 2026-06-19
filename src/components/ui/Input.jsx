import React from "react";

const baseField = (invalid) => ({
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-base)",
  color: "var(--text-strong)",
  background: "var(--white)",
  border: `var(--border-width) solid ${invalid ? "var(--danger)" : "var(--border-soft)"}`,
  borderRadius: "var(--radius-md)",
  padding: "13px 16px",
  outline: "none",
  transition: "border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)",
});

function focusOn(e, invalid) {
  e.currentTarget.style.borderColor = invalid ? "var(--danger)" : "var(--focus-ring)";
  e.currentTarget.style.boxShadow = `0 0 0 4px ${invalid ? "var(--danger-100)" : "var(--blue-100)"}`;
}
function focusOff(e, invalid) {
  e.currentTarget.style.borderColor = invalid ? "var(--danger)" : "var(--border-soft)";
  e.currentTarget.style.boxShadow = "none";
}

/** Text input with the SDC rounded field styling and a soft focus ring. */
export function Input({ invalid = false, style = {}, onFocus, onBlur, ...rest }) {
  return (
    <input
      style={{ ...baseField(invalid), ...style }}
      onFocus={(e) => { focusOn(e, invalid); onFocus && onFocus(e); }}
      onBlur={(e) => { focusOff(e, invalid); onBlur && onBlur(e); }}
      {...rest}
    />
  );
}

/** Multi-line input sharing the Input styling. */
export function Textarea({ invalid = false, rows = 4, style = {}, onFocus, onBlur, ...rest }) {
  return (
    <textarea
      rows={rows}
      style={{ ...baseField(invalid), resize: "vertical", minHeight: "96px", lineHeight: "var(--leading-normal)", ...style }}
      onFocus={(e) => { focusOn(e, invalid); onFocus && onFocus(e); }}
      onBlur={(e) => { focusOff(e, invalid); onBlur && onBlur(e); }}
      {...rest}
    />
  );
}
