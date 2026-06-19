import React from "react";

/** Small rounded status / category pill. */
export function Badge({ tone = "brand", size = "md", style = {}, children, ...rest }) {
  const tones = {
    brand:      { bg: "var(--brand-soft)", fg: "var(--brand)" },
    strawberry: { bg: "var(--strawberry-100)", fg: "var(--strawberry-600)" },
    grape:      { bg: "var(--grape-100)", fg: "var(--grape-600)" },
    honey:      { bg: "var(--honey-100)", fg: "var(--warning-600)" },
    success:    { bg: "var(--success-100)", fg: "var(--success-600)" },
    neutral:    { bg: "var(--ink-100)", fg: "var(--ink-600)" },
  };
  const t = tones[tone] || tones.brand;
  const sizes = {
    sm: { padding: "3px 9px", font: "var(--text-xs)" },
    md: { padding: "5px 12px", font: "var(--text-sm)" },
  };
  const s = sizes[size] || sizes.md;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: s.padding,
        fontFamily: "var(--font-sans)",
        fontSize: s.font,
        fontWeight: "var(--weight-bold)",
        letterSpacing: "var(--tracking-snug)",
        color: t.fg,
        background: t.bg,
        borderRadius: "var(--radius-pill)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
