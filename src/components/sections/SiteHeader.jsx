import React from "react";
import { Button } from "../ui";

// Sticky site header for the SDC Donut Presale page.
export function SiteHeader({ onReserve }) {
  const link = {
    fontFamily: "var(--font-sans)",
    fontSize: "var(--text-base)",
    fontWeight: "var(--weight-semibold)",
    color: "var(--text-body)",
    textDecoration: "none",
    padding: "8px 4px",
  };
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(255,251,245,0.86)",
        backdropFilter: "saturate(1.4) blur(10px)",
        borderBottom: "1.5px solid var(--border-soft)",
      }}
    >
      <div
        style={{
          maxWidth: "var(--container-max)",
          margin: "0 auto",
          padding: "12px var(--gutter)",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <a href="#top" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
          <img src="/assets/logo/sdc-logo.png" alt="SDC" style={{ width: 44, height: 44 }} />
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--text-lg)", color: "var(--brand-strong)", letterSpacing: "var(--tracking-tight)" }}>
              Donut Presale
            </span>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-muted)", letterSpacing: "var(--tracking-snug)" }}>
              Social Diversity for Children
            </span>
          </span>
        </a>
        <nav style={{ display: "flex", gap: "22px", marginLeft: "auto" }} className="site-nav">
          <a href="#cause" style={link}>The cause</a>
          <a href="#donuts" style={link}>Donuts</a>
          <a href="#pickup" style={link}>Pickup &amp; pay</a>
        </nav>
        <Button variant="candy" size="sm" onClick={onReserve}>Reserve now</Button>
      </div>
    </header>
  );
}
