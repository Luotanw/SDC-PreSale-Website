import React from "react";

/**
 * SDC primary action button. Rounded, warm, with soft press feedback.
 */
export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  iconLeft = null,
  iconRight = null,
  disabled = false,
  type = "button",
  style = {},
  children,
  ...rest
}) {
  const sizes = {
    sm: { padding: "8px 16px", font: "var(--text-sm)", radius: "var(--radius-sm)", gap: "6px", minH: "38px" },
    md: { padding: "12px 24px", font: "var(--text-base)", radius: "var(--radius-md)", gap: "8px", minH: "48px" },
    lg: { padding: "16px 32px", font: "var(--text-md)", radius: "var(--radius-lg)", gap: "10px", minH: "58px" },
  };
  const s = sizes[size] || sizes.md;

  const variants = {
    primary: {
      background: "var(--brand)",
      color: "var(--text-on-brand)",
      border: "var(--border-width) solid transparent",
      boxShadow: "var(--shadow-brand)",
    },
    candy: {
      background: "var(--accent-strawberry)",
      color: "var(--white)",
      border: "var(--border-width) solid transparent",
      boxShadow: "var(--shadow-candy)",
    },
    secondary: {
      background: "var(--white)",
      color: "var(--brand)",
      border: "var(--border-width) solid var(--border-brand)",
      boxShadow: "var(--shadow-xs)",
    },
    ghost: {
      background: "transparent",
      color: "var(--brand)",
      border: "var(--border-width) solid transparent",
      boxShadow: "none",
    },
  };
  const v = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: s.gap,
        padding: s.padding,
        minHeight: s.minH,
        width: fullWidth ? "100%" : "auto",
        font: "var(--font-sans)",
        fontSize: s.font,
        fontWeight: "var(--weight-bold)",
        lineHeight: 1,
        letterSpacing: "var(--tracking-snug)",
        borderRadius: s.radius,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "transform var(--dur-fast) var(--ease-out), filter var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)",
        WebkitTapHighlightColor: "transparent",
        ...v,
        ...style,
      }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(0.97)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.filter = "brightness(0.94)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; e.currentTarget.style.transform = "scale(1)"; }}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
