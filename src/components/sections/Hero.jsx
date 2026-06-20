import React from "react";
import { Button, Badge, DonutGraphic, Icon } from "../ui";
import { PRICE_PER_DOZEN } from "../../../shared/orderPolicy.js";

// Hero — fundraiser name, mission line, CTA, donut cluster.
export function Hero({ onReserve }) {
  return (
    <section
      id="top"
      style={{
        maxWidth: "var(--container-max)",
        margin: "0 auto",
        padding: "var(--space-20) var(--gutter) var(--space-12)",
        display: "grid",
        gridTemplateColumns: "1.05fr 0.95fr",
        gap: "var(--space-12)",
        alignItems: "center",
      }}
      className="hero-grid"
    >
      <div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "var(--text-sm)",
            fontWeight: 700,
            color: "var(--accent-strawberry)",
            letterSpacing: "var(--tracking-caps)",
            textTransform: "uppercase",
          }}
        >
          <Icon name="cookie" size={16} /> Krispy Kreme Fundraiser
        </span>
        <h1
          style={{
            font: "var(--font-hero)",
            fontSize: "clamp(40px, 6vw, 68px)",
            color: "var(--brand-strong)",
            margin: "14px 0 0",
            letterSpacing: "var(--tracking-tight)",
          }}
        >
          Sweeter together,<br />one dozen at a time.
        </h1>
        <p
          style={{
            font: "var(--font-body)",
            fontSize: "var(--text-lg)",
            color: "var(--text-body)",
            maxWidth: "30rem",
            margin: "18px 0 0",
            lineHeight: "var(--leading-relaxed)",
          }}
        >
          Order a dozen Original Glazed and help SDC youth volunteers build programs
          for children with special needs. Pick up fresh this Sunday.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "28px" }}>
          <Button variant="candy" size="lg" onClick={onReserve} iconRight={<Icon name="arrow-right" size={18} />}>
            Reserve my dozen
          </Button>
          <Button variant="secondary" size="lg" onClick={() => document.getElementById("cause").scrollIntoView({ behavior: "smooth" })}>
            How it helps
          </Button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "26px" }}>
          <Badge tone="brand"><Icon name="calendar-check" size={14} /> Pickup Sun, Jun 21</Badge>
          <Badge tone="honey"><Icon name="badge-dollar-sign" size={14} /> ${PRICE_PER_DOZEN} / dozen</Badge>
        </div>
      </div>

      {/* Donut cluster */}
      <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", minHeight: 360 }}>
        <div
          style={{
            position: "absolute",
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: "radial-gradient(circle at 50% 45%, var(--blue-100), var(--blue-50))",
            filter: "blur(2px)",
          }}
        />
        <div style={{ position: "relative", transform: "rotate(-6deg)" }}>
          <DonutGraphic glaze="glazed" size={300} holeColor="var(--surface-page)" sprinkles={false} />
        </div>
        {/* price tag */}
        <div
          style={{
            position: "absolute",
            bottom: 28,
            right: 0,
            background: "var(--white)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-lg)",
            padding: "10px 16px",
            transform: "rotate(6deg)",
            border: "1.5px solid var(--border-soft)",
          }}
        >
          <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "var(--tracking-caps)" }}>Dozen</div>
          <div style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--brand)", lineHeight: 1 }}>${PRICE_PER_DOZEN}</div>
        </div>
      </div>
    </section>
  );
}
