import React from "react";

/**
 * Stylized glazed-donut brand illustration, drawn in pure CSS.
 * Use as friendly campaign artwork where a real photo isn't available.
 */
export function DonutGraphic({
  glaze = "strawberry",
  size = 220,
  holeColor = "var(--surface-page)",
  sprinkles = true,
  style = {},
}) {
  const glazes = {
    strawberry: { a: "#FF9BBA", b: "#FF6E9C", sprinkle: ["#FFFFFF", "#6C63FF", "#FFD23E"] },
    glazed:     { a: "#F7DFAC", b: "#E7BC77", sprinkle: ["#FFFFFF"] },
    grape:      { a: "#8B82FF", b: "#6C63FF", sprinkle: ["#FFFFFF", "#FF7AA2", "#FFD23E"] },
    honey:      { a: "#FFDD6B", b: "#FFC233", sprinkle: ["#FFFFFF", "#FF7AA2", "#6C63FF"] },
    chocolate:  { a: "#7A4A30", b: "#5A3420", sprinkle: ["#FFFFFF", "#FF7AA2", "#FFD23E"] },
  };
  const g = glazes[glaze] || glazes.strawberry;
  const dough = "#EAB079";

  // deterministic sprinkle ring
  const items = [];
  if (sprinkles) {
    const n = 11;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * 360 + (i % 2 ? 16 : -10);
      const rad = size * 0.315;
      const cx = Math.cos((ang * Math.PI) / 180) * rad;
      const cy = Math.sin((ang * Math.PI) / 180) * rad;
      const color = g.sprinkle[i % g.sprinkle.length];
      items.push(
        <span
          key={i}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: size * 0.055,
            height: size * 0.022,
            background: color,
            borderRadius: "999px",
            transform: `translate(-50%, -50%) translate(${cx}px, ${cy}px) rotate(${ang + 40}deg)`,
          }}
        />
      );
    }
  }

  return (
    <div
      role="img"
      aria-label={`${glaze} glazed donut`}
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle at 38% 32%, ${dough}, #D9974F)`,
        boxShadow: "var(--shadow-md)",
        flex: "none",
        ...style,
      }}
    >
      {/* glaze */}
      <div
        style={{
          position: "absolute",
          inset: size * 0.045,
          borderRadius: "50%",
          background: `radial-gradient(circle at 38% 30%, ${g.a}, ${g.b})`,
        }}
      />
      {/* highlight */}
      <div
        style={{
          position: "absolute",
          top: size * 0.12,
          left: size * 0.16,
          width: size * 0.26,
          height: size * 0.16,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.34)",
          filter: "blur(2px)",
        }}
      />
      {/* sprinkles */}
      {items}
      {/* hole */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: size * 0.34,
          height: size * 0.34,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: holeColor,
          boxShadow: "inset 0 2px 8px rgba(28,34,48,0.18)",
        }}
      />
    </div>
  );
}
