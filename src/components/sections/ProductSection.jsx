import React from "react";
import { Card, Badge, Button, QuantityStepper, DonutGraphic, Icon } from "../ui";
import { MAX_ORDER_QUANTITY } from "../../../shared/orderPolicy.js";

// Product selector — Original Glazed dozen, qty, running total.
export function ProductSection({ qty, setQty, price = 15, onAdd }) {
  const total = qty * price;
  return (
    <section
      id="donuts"
      style={{ background: "var(--surface-subtle)", borderTop: "1.5px solid var(--border-brand)", borderBottom: "1.5px solid var(--border-brand)" }}
    >
      <div style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "var(--space-16) var(--gutter)" }}>
        <div style={{ textAlign: "center", marginBottom: "var(--space-10)" }}>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--accent-strawberry)", letterSpacing: "var(--tracking-caps)", textTransform: "uppercase" }}>
            Choose your donuts
          </span>
          <h2 style={{ font: "var(--font-display-1)", fontSize: "var(--text-3xl)", color: "var(--brand-strong)", margin: "8px 0 0", letterSpacing: "var(--tracking-tight)" }}>
            Fresh Krispy Kreme, by the dozen.
          </h2>
        </div>

        <Card tone="default" elevation="lg" padding="none" style={{ overflow: "hidden", maxWidth: 860, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr" }} className="product-grid">
            {/* visual */}
            <div style={{ background: "radial-gradient(circle at 50% 40%, var(--honey-100), var(--white))", display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-10)", minHeight: 280 }}>
              <DonutGraphic glaze="glazed" size={230} holeColor="#FFFDF8" sprinkles={false} />
            </div>
            {/* details */}
            <div style={{ padding: "var(--space-8)" }}>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                <Badge tone="strawberry">Original Glazed</Badge>
                <Badge tone="neutral">12 donuts</Badge>
              </div>
              <h3 style={{ font: "var(--font-heading)", fontSize: "var(--text-2xl)", color: "var(--text-strong)", margin: 0 }}>
                Original Glazed — Dozen
              </h3>
              <p style={{ font: "var(--font-body)", color: "var(--text-body)", marginTop: "8px", lineHeight: "var(--leading-normal)" }}>
                A full dozen of the classic melt-in-your-mouth glazed. Boxed fresh for Sunday pickup.
              </p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "14px" }}>
                <span style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--brand)" }}>${price}</span>
                <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>/ dozen</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginTop: "22px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "var(--tracking-caps)", marginBottom: "6px" }}>Quantity</div>
                  <QuantityStepper value={qty} onChange={setQty} min={1} max={MAX_ORDER_QUANTITY} suffix="dozen" />
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "var(--tracking-caps)" }}>Total</div>
                  <div style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--brand-strong)" }}>${total}</div>
                </div>
              </div>

              <Button variant="candy" size="lg" fullWidth style={{ marginTop: "22px" }} onClick={onAdd} iconLeft={<Icon name="shopping-bag" size={18} />}>
                Add to my order
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
