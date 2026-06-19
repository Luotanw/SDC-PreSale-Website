import React from "react";

/**
 * Rounded white surface — the workhorse container for the campaign.
 */
export function Card({ tone = "default", padding = "lg", elevation = "md", style = {}, children, ...rest }) {
  const pads = { none: "0", sm: "var(--space-4)", md: "var(--space-6)", lg: "var(--space-8)" };
  const elevations = {
    flat: "none",
    xs: "var(--shadow-xs)",
    sm: "var(--shadow-sm)",
    md: "var(--shadow-md)",
    lg: "var(--shadow-lg)",
  };
  const tones = {
    default: { background: "var(--surface-card)", border: "var(--border-width) solid var(--border-soft)" },
    subtle: { background: "var(--surface-subtle)", border: "var(--border-width) solid var(--border-brand)" },
    brand: { background: "var(--surface-brand)", border: "var(--border-width) solid transparent", color: "var(--text-on-brand)" },
    strawberry: { background: "var(--strawberry-100)", border: "var(--border-width) solid var(--strawberry-200)" },
    honey: { background: "var(--honey-100)", border: "var(--border-width) solid var(--honey-200)" },
  };
  return (
    <div
      style={{
        borderRadius: "var(--radius-xl)",
        padding: pads[padding] ?? pads.lg,
        boxShadow: elevations[elevation] ?? elevations.md,
        ...tones[tone],
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
