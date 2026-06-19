import React from "react";

// Contact footer.
export function SiteFooter() {
  const link = { color: "rgba(255,255,255,0.82)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "var(--text-base)", fontWeight: 500 };
  return (
    <footer style={{ background: "var(--brand-strong)", color: "var(--white)" }}>
      <div style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "var(--space-16) var(--gutter) var(--space-10)", display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "var(--space-10)" }} className="footer-grid">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Full-colour mark on a white chip so the blue disc stays legible on the dark footer. */}
            <img src="/assets/logo/sdc-logo.png" alt="SDC" style={{ width: 52, height: 52, background: "var(--white)", borderRadius: "50%", padding: 2 }} />
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontWeight: 800, fontSize: "var(--text-lg)" }}>Donut Presale</div>
              <div style={{ fontSize: "var(--text-sm)", color: "rgba(255,255,255,0.7)" }}>Social Diversity for Children</div>
            </div>
          </div>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "var(--text-sm)", marginTop: "16px", maxWidth: "26rem", lineHeight: "var(--leading-relaxed)" }}>
            SDC is a registered Canadian charity empowering youth to support children with special needs.
          </p>
        </div>

        <div>
          <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "var(--tracking-caps)", color: "rgba(255,255,255,0.6)", marginBottom: "14px" }}>The presale</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <a href="#cause" style={link}>The cause</a>
            <a href="#donuts" style={link}>Order donuts</a>
            <a href="#pickup" style={link}>Pickup &amp; payment</a>
          </div>
        </div>
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.14)" }}>
        <div style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "18px var(--gutter)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", fontSize: "var(--text-xs)", color: "rgba(255,255,255,0.6)" }}>
          <span>© 2026 Social Diversity for Children Foundation</span>
        </div>
      </div>
    </footer>
  );
}
