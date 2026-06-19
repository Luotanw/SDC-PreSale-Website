import React from "react";

/**
 * Label + optional helper / error text wrapper for form fields.
 */
export function FieldLabel({ label, htmlFor, required = false, hint = null, error = null, children, style = {} }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", ...style }}>
      {label && (
        <label
          htmlFor={htmlFor}
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--weight-bold)",
            color: "var(--text-strong)",
            letterSpacing: "var(--tracking-snug)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {label}
          {required && <span style={{ color: "var(--accent-strawberry)" }}>*</span>}
        </label>
      )}
      {children}
      {error ? (
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-medium)", color: "var(--danger)" }}>
          {error}
        </span>
      ) : hint ? (
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}
