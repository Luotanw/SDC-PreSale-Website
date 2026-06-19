import React from "react";
import {
  ArrowRight,
  BadgeDollarSign,
  CalendarCheck,
  Check,
  Clock,
  Cookie,
  CreditCard,
  Info,
  MapPin,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";

// Shared icon wrapper for the website. The design refers to icons by their
// Lucide glyph name (kebab-case); we map those to the specific lucide-react
// components actually used, so the bundle only includes these icons.
// Add a glyph here when a section starts using a new icon name.
const GLYPHS = {
  "arrow-right": ArrowRight,
  "badge-dollar-sign": BadgeDollarSign,
  "calendar-check": CalendarCheck,
  check: Check,
  clock: Clock,
  cookie: Cookie,
  "credit-card": CreditCard,
  info: Info,
  "map-pin": MapPin,
  "shield-check": ShieldCheck,
  "shopping-bag": ShoppingBag,
};

export function Icon({ name, size = 20, color = "currentColor", strokeWidth = 2, style = {} }) {
  const Glyph = GLYPHS[name];
  if (import.meta.env.DEV && !Glyph) {
    console.warn(`[Icon] Unknown icon "${name}". Add it to GLYPHS in src/components/ui/Icon.jsx.`);
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", color, ...style }}>
      {Glyph ? <Glyph size={size} strokeWidth={strokeWidth} /> : null}
    </span>
  );
}
