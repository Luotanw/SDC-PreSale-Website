import React from "react";

/**
 * Quantity stepper for choosing dozens. Big rounded touch targets (48px).
 */
export function QuantityStepper({ value = 1, min = 1, max = 30, onChange = () => {}, suffix = "", style = {} }) {
  const clamp = (n) => Math.max(min, Math.min(max, n));
  const set = (n) => onChange(clamp(n));

  const btn = (label, fn, disabled) => (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={fn}
      style={{
        width: "48px",
        height: "48px",
        flex: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "var(--text-xl)",
        fontWeight: "var(--weight-bold)",
        lineHeight: 1,
        color: disabled ? "var(--text-faint)" : "var(--brand)",
        background: "var(--white)",
        border: "none",
        borderRadius: "var(--radius-md)",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background var(--dur-base) var(--ease-out)",
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "var(--blue-50)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "var(--white)"; }}
    >
      {label === "Decrease" ? "−" : "+"}
    </button>
  );

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px",
        background: "var(--surface-subtle)",
        border: "var(--border-width) solid var(--border-soft)",
        borderRadius: "var(--radius-lg)",
        ...style,
      }}
    >
      {btn("Decrease", () => set(value - 1), value <= min)}
      <div
        style={{
          minWidth: "64px",
          textAlign: "center",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-lg)",
          fontWeight: "var(--weight-extra)",
          color: "var(--text-strong)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}{suffix ? <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--text-muted)" }}> {suffix}</span> : null}
      </div>
      {btn("Increase", () => set(value + 1), value >= max)}
    </div>
  );
}
