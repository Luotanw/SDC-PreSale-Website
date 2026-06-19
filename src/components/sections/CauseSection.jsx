import React from "react";
import { Card, ProgressBar, Badge, Icon } from "../ui";

// The cause + fundraising goal progress.
export function CauseSection({ boxesSold = 18, goalBoxes = 30, pricePerBox = 15 }) {
  const raised = boxesSold * pricePerBox;
  const goal = goalBoxes * pricePerBox;
  return (
    <section
      id="cause"
      style={{
        maxWidth: "var(--container-max)",
        margin: "0 auto",
        padding: "var(--space-16) var(--gutter)",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "var(--space-12)",
        alignItems: "center",
      }}
      className="cause-grid"
    >
      <div>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--accent-grape)", letterSpacing: "var(--tracking-caps)", textTransform: "uppercase" }}>
          The cause
        </span>
        <h2 style={{ font: "var(--font-display-1)", fontSize: "var(--text-3xl)", color: "var(--brand-strong)", margin: "10px 0 0", letterSpacing: "var(--tracking-tight)" }}>
          Every box funds youth-led programs.
        </h2>
        <p style={{ font: "var(--font-body)", fontSize: "var(--text-md)", color: "var(--text-body)", lineHeight: "var(--leading-relaxed)", marginTop: "16px" }}>
          The Social Diversity for Children Foundation empowers young volunteers to create
          inclusive programs for children with special needs. Proceeds from this presale go
          directly toward those programs &mdash; from sensory-friendly events to one-on-one mentorship.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "18px" }}>
          <Badge tone="neutral"><Icon name="shield-check" size={14} /> Registered Canadian charity</Badge>
        </div>
      </div>

      <Card tone="default" elevation="lg" padding="lg">
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "var(--text-4xl)", fontWeight: 800, color: "var(--brand-strong)", lineHeight: 1 }}>
              ${raised}
            </div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginTop: "4px" }}>raised of ${goal} goal</div>
          </div>
          <Badge tone="strawberry">{Math.round((boxesSold / goalBoxes) * 100)}% there</Badge>
        </div>
        <div style={{ marginTop: "20px" }}>
          <ProgressBar value={boxesSold} max={goalBoxes} size="lg" valueText={`${boxesSold} of ${goalBoxes} boxes`} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "22px" }}>
          <div style={{ background: "var(--surface-subtle)", borderRadius: "var(--radius-md)", padding: "14px 16px" }}>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--brand)" }}>{goalBoxes - boxesSold}</div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>boxes still needed</div>
          </div>
          <div style={{ background: "var(--strawberry-100)", borderRadius: "var(--radius-md)", padding: "14px 16px" }}>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--strawberry-600)" }}>${pricePerBox}</div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>per dozen donated</div>
          </div>
        </div>
      </Card>
    </section>
  );
}
