import React from "react";
import { Card, Badge, Icon } from "../ui";

// Pickup details + payment instructions.
export function PickupPayment() {
  const detail = (icon, label, value) => (
    <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
      <span style={{ display: "inline-flex", width: 42, height: 42, flex: "none", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.16)", color: "var(--white)", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={20} color="var(--white)" />
      </span>
      <div>
        <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "var(--tracking-caps)" }}>{label}</div>
        <div style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--white)", marginTop: "2px" }}>{value}</div>
      </div>
    </div>
  );

  const step = (n, title, body) => (
    <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
      <span style={{ display: "inline-flex", width: 30, height: 30, flex: "none", borderRadius: "var(--radius-pill)", background: "var(--brand-soft)", color: "var(--brand)", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "var(--text-sm)" }}>{n}</span>
      <div>
        <div style={{ fontWeight: 700, color: "var(--text-strong)" }}>{title}</div>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginTop: "2px", lineHeight: "var(--leading-normal)" }}>{body}</div>
      </div>
    </div>
  );

  return (
    <section id="pickup" style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "var(--space-12) var(--gutter) var(--space-20)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-8)", alignItems: "stretch" }} className="pickup-grid">
        {/* pickup */}
        <Card tone="brand" elevation="lg" padding="lg">
          <Badge tone="honey" style={{ marginBottom: "18px" }}><Icon name="map-pin" size={14} /> Pickup details</Badge>
          <h3 style={{ font: "var(--font-heading)", color: "var(--white)", margin: "0 0 22px", fontSize: "var(--text-2xl)" }}>
            One pickup day — fresh &amp; ready.
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {detail("calendar-check", "Date", "Sunday, June 21, 2026")}
            {detail("clock", "Time window", "10:00 AM – 4:00 PM")}
            {detail("map-pin", "Location", (
              <>
                Save On Foods (Garden City)
                <span style={{ display: "block", fontWeight: 500, fontSize: "var(--text-sm)", color: "rgba(255,255,255,0.75)", marginTop: "2px" }}>
                  9100 Blundell Rd, Richmond, BC V6Y 2R1
                </span>
              </>
            ))}
          </div>
          <p style={{ fontSize: "var(--text-sm)", color: "rgba(255,255,255,0.75)", marginTop: "22px", lineHeight: "var(--leading-normal)" }}>
            We'll email your exact pickup slot after you reserve. Can't make it? Reply to that email and we'll sort it out.
          </p>
        </Card>

        {/* payment */}
        <Card tone="default" elevation="md" padding="lg">
          <Badge tone="grape" style={{ marginBottom: "18px" }}><Icon name="credit-card" size={14} /> How to pay</Badge>
          <h3 style={{ font: "var(--font-heading)", color: "var(--text-strong)", margin: "0 0 8px", fontSize: "var(--text-2xl)" }}>
            Pay at pickup — card or cash.
          </h3>
          <p style={{ color: "var(--text-body)", fontSize: "var(--text-base)", marginBottom: "22px", lineHeight: "var(--leading-normal)" }}>
            No payment needed today. Just reserve now and settle up when you grab your donuts.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {step(1, "Reserve online", "Fill in the form above to hold your dozen(s).")}
            {step(2, "Come Sunday", "Drop by the pickup window on June 21.")}
            {step(3, "Tap or cash", "Pay by card on our reader, or with exact cash. Tax receipts available on request.")}
          </div>
        </Card>
      </div>
    </section>
  );
}
