import React from "react";

/** Native select with SDC field styling and a custom chevron. */
export function Select({ invalid = false, style = {}, children, onFocus, onBlur, ...rest }) {
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <select
        style={{
          width: "100%",
          boxSizing: "border-box",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-base)",
          color: "var(--text-strong)",
          background: "var(--white)",
          border: `var(--border-width) solid ${invalid ? "var(--danger)" : "var(--border-soft)"}`,
          borderRadius: "var(--radius-md)",
          padding: "13px 44px 13px 16px",
          appearance: "none",
          WebkitAppearance: "none",
          outline: "none",
          cursor: "pointer",
          transition: "border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)",
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--focus-ring)";
          e.currentTarget.style.boxShadow = "0 0 0 4px var(--blue-100)";
          onFocus && onFocus(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = invalid ? "var(--danger)" : "var(--border-soft)";
          e.currentTarget.style.boxShadow = "none";
          onBlur && onBlur(e);
        }}
        {...rest}
      >
        {children}
      </select>
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          right: "16px",
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: "var(--text-muted)",
          fontSize: "12px",
        }}
      >
        ▼
      </span>
    </div>
  );
}
