import React from "react";

/**
 * Fundraising progress bar. Rounded track, candy-pink fill, optional caption.
 */
export function ProgressBar({
  value = 0,
  max = 100,
  label = null,
  valueText = null,
  showPercent = false,
  size = "md",
  style = {},
}) {
  const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0));
  const heights = { sm: "10px", md: "16px", lg: "24px" };
  const h = heights[size] || heights.md;

  return (
    <div style={{ width: "100%", ...style }}>
      {(label || valueText) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px", gap: "12px" }}>
          {label && (
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-bold)", color: "var(--text-strong)" }}>
              {label}
            </span>
          )}
          {valueText && (
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-bold)", color: "var(--accent-strawberry)" }}>
              {valueText}
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        style={{
          width: "100%",
          height: h,
          background: "var(--progress-track)",
          borderRadius: "var(--radius-pill)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: pct + "%",
            height: "100%",
            background: "linear-gradient(90deg, var(--strawberry-500), var(--strawberry-600))",
            borderRadius: "var(--radius-pill)",
            transition: "width var(--dur-slow) var(--ease-out)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          {showPercent && pct > 12 && (
            <span style={{ color: "var(--white)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-bold)", paddingRight: "10px" }}>
              {Math.round(pct)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
