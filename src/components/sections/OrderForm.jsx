import React from "react";
import { Card, Button, Input, Select, Textarea, FieldLabel, Badge, DonutGraphic, Icon, Turnstile } from "../ui";
import { submitOrder } from "../../lib/submitOrder.js";
import {
  MAX_ORDER_QUANTITY,
  PICKUP_WINDOWS,
} from "../../../shared/orderPolicy.js";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

// Order form with inline confirmation state. The server validates and stores
// the order before this component displays success.
export function OrderForm({ qty, setQty, price = 15, onOrderPlaced }) {
  const [submitted, setSubmitted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [orderId, setOrderId] = React.useState(null); // set once placed; edits update this order
  const [editToken, setEditToken] = React.useState(null);
  const [captchaToken, setCaptchaToken] = React.useState(null);
  const [captchaResetKey, setCaptchaResetKey] = React.useState(0);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [pickup, setPickup] = React.useState(PICKUP_WINDOWS[0]);
  const [notes, setNotes] = React.useState("");
  const total = qty * price;

  const scrollToOrder = () => {
    const el = document.getElementById("order");
    if (el) window.scrollTo({ top: el.offsetTop - 70, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orderId && TURNSTILE_SITE_KEY && !captchaToken) {
      setError("Please complete the human verification.");
      return;
    }
    setSubmitting(true);
    setError(null);
    // When orderId is set we're editing — update that order rather than adding one.
    const result = await submitOrder(
      {
        name,
        email,
        phone,
        quantity: qty,
        pickup,
        notes,
      },
      { id: orderId, editToken, captchaToken }
    );
    setSubmitting(false);
    if (result.ok) {
      if (result.id) setOrderId(result.id);
      if (result.editToken) setEditToken(result.editToken);
      setSubmitted(true);
      onOrderPlaced?.(); // refresh the live "boxes ordered" dashboard
      scrollToOrder();
    } else {
      setError(result.error || "Something went wrong saving your order. Please try again.");
      if (!orderId && TURNSTILE_SITE_KEY) {
        setCaptchaToken(null);
        setCaptchaResetKey((key) => key + 1);
      }
    }
  };

  if (submitted) {
    return (
      <section id="order" style={{ maxWidth: "var(--container-narrow)", margin: "0 auto", padding: "var(--space-16) var(--gutter)" }}>
        <Card tone="default" elevation="lg" padding="lg" style={{ textAlign: "center" }}>
          <div style={{ display: "inline-flex", width: 64, height: 64, borderRadius: "var(--radius-pill)", background: "var(--success-100)", color: "var(--success-600)", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <Icon name="check" size={32} strokeWidth={2.5} />
          </div>
          <h2 style={{ font: "var(--font-display-1)", fontSize: "var(--text-3xl)", color: "var(--brand-strong)", margin: 0 }}>
            You're on the list! 🎉
          </h2>
          <p style={{ color: "var(--text-body)", fontSize: "var(--text-md)", marginTop: "12px", lineHeight: "var(--leading-relaxed)" }}>
            Thanks{name ? `, ${name.split(" ")[0]}` : ""}! We've reserved <strong>{qty} dozen</strong> (${total}).
            A confirmation with pickup details is on its way to {email || "your email"}.
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", marginTop: "20px" }}>
            <Badge tone="brand"><Icon name="calendar-check" size={14} /> Sun, Jun 21</Badge>
            <Badge tone="grape"><Icon name="credit-card" size={14} /> Pay at pickup</Badge>
          </div>
          <Button variant="secondary" style={{ marginTop: "24px" }} onClick={() => setSubmitted(false)}>
            Edit my order
          </Button>
        </Card>
      </section>
    );
  }

  return (
    <section id="order" style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "var(--space-16) var(--gutter)" }}>
      <div style={{ textAlign: "center", marginBottom: "var(--space-10)" }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--accent-grape)", letterSpacing: "var(--tracking-caps)", textTransform: "uppercase" }}>
          Reserve your order
        </span>
        <h2 style={{ font: "var(--font-display-1)", fontSize: "var(--text-3xl)", color: "var(--brand-strong)", margin: "8px 0 0", letterSpacing: "var(--tracking-tight)" }}>
          Just a few details.
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.9fr", gap: "var(--space-8)", alignItems: "start" }} className="order-grid">
        <Card tone="default" elevation="md" padding="lg">
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <FieldLabel label="Full name" htmlFor="of-name" required>
                  <Input id="of-name" placeholder="Alex Chen" value={name} onChange={(e) => setName(e.target.value)} required />
                </FieldLabel>
              </div>
              <FieldLabel label="Email" htmlFor="of-email" required hint="For your confirmation + receipt">
                <Input id="of-email" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </FieldLabel>
              <FieldLabel label="Phone" htmlFor="of-phone" hint="Optional">
                <Input id="of-phone" type="tel" placeholder="(604) 555-0123" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </FieldLabel>
              <FieldLabel label="Quantity" htmlFor="of-qty">
                <Select id="of-qty" value={qty} onChange={(e) => setQty(Number(e.target.value))}>
                  {Array.from({ length: MAX_ORDER_QUANTITY }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n} dozen — ${n * price}</option>
                  ))}
                </Select>
              </FieldLabel>
              <FieldLabel label="Pickup time" htmlFor="of-time">
                <Select id="of-time" value={pickup} onChange={(e) => setPickup(e.target.value)}>
                  {PICKUP_WINDOWS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </Select>
              </FieldLabel>
              <div style={{ gridColumn: "1 / -1" }}>
                <FieldLabel label="Notes (optional)" htmlFor="of-notes" hint="Allergies, who's picking up, etc.">
                  <Textarea id="of-notes" rows={2} placeholder="Anything we should know?" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </FieldLabel>
              </div>
            </div>
            {!orderId && TURNSTILE_SITE_KEY && (
              <div style={{ marginTop: "20px" }}>
                <Turnstile
                  siteKey={TURNSTILE_SITE_KEY}
                  onToken={setCaptchaToken}
                  resetKey={captchaResetKey}
                />
              </div>
            )}
            <Button
              type="submit"
              variant="candy"
              size="lg"
              fullWidth
              disabled={submitting || (!orderId && TURNSTILE_SITE_KEY && !captchaToken)}
              style={{ marginTop: "24px" }}
              iconRight={submitting ? null : <Icon name="arrow-right" size={18} />}
            >
              {submitting
                ? orderId ? "Saving…" : "Reserving…"
                : orderId ? `Update my order · $${total}` : `Reserve ${qty} dozen · $${total}`}
            </Button>
            {error && (
              <p role="alert" style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--danger)", textAlign: "center", marginTop: "12px" }}>
                {error}
              </p>
            )}
            <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", textAlign: "center", marginTop: "12px" }}>
              No payment now — pay by card or cash at pickup.
            </p>
          </form>
        </Card>

        {/* order summary */}
        <Card tone="subtle" elevation="sm" padding="lg" style={{ position: "sticky", top: 88 }}>
          <h3 style={{ font: "var(--font-subhead)", color: "var(--brand-strong)", margin: 0 }}>Order summary</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "16px" }}>
            <DonutGraphic glaze="glazed" size={68} holeColor="var(--surface-subtle)" sprinkles={false} />
            <div>
              <div style={{ fontWeight: 700, color: "var(--text-strong)" }}>Original Glazed</div>
              <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{qty} dozen × ${price}</div>
            </div>
          </div>
          <div style={{ height: 1, background: "var(--border-brand)", margin: "18px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", color: "var(--text-body)" }}>
            <span>Subtotal</span><span>${total}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "12px" }}>
            <span style={{ fontWeight: 700, color: "var(--text-strong)" }}>Total</span>
            <span style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--brand)" }}>${total}</span>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "16px", color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>
            <Icon name="info" size={14} /> 100% supports SDC programs
          </div>
        </Card>
      </div>
    </section>
  );
}
