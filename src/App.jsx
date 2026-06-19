import React from "react";
import { SiteHeader } from "./components/sections/SiteHeader.jsx";
import { Hero } from "./components/sections/Hero.jsx";
import { CauseSection } from "./components/sections/CauseSection.jsx";
import { ProductSection } from "./components/sections/ProductSection.jsx";
import { OrderForm } from "./components/sections/OrderForm.jsx";
import { PickupPayment } from "./components/sections/PickupPayment.jsx";
import { SiteFooter } from "./components/sections/SiteFooter.jsx";
import { fetchBoxesOrdered } from "./lib/submitOrder.js";

// Campaign config — swap these for your real numbers before launch.
const PRICE_PER_DOZEN = 15;
const GOAL_BOXES = 30;

export default function App() {
  // Quantity is shared across the stepper, the order form, the summary,
  // and the CTA labels so they all stay in sync.
  const [qty, setQty] = React.useState(1);

  // Live total of dozens pre-ordered, read from the server's orders.csv.
  const [boxesOrdered, setBoxesOrdered] = React.useState(0);

  const refreshStats = React.useCallback(async () => {
    const count = await fetchBoxesOrdered();
    if (count !== null) setBoxesOrdered(count);
  }, []);

  React.useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const scrollToOrder = () => {
    const el = document.getElementById("order");
    if (el) window.scrollTo({ top: el.offsetTop - 70, behavior: "smooth" });
  };

  return (
    <>
      <SiteHeader onReserve={scrollToOrder} />
      <Hero onReserve={scrollToOrder} />
      <CauseSection boxesSold={boxesOrdered} goalBoxes={GOAL_BOXES} pricePerBox={PRICE_PER_DOZEN} />
      <ProductSection qty={qty} setQty={setQty} price={PRICE_PER_DOZEN} onAdd={scrollToOrder} />
      <OrderForm qty={qty} setQty={setQty} price={PRICE_PER_DOZEN} onOrderPlaced={refreshStats} />
      <PickupPayment />
      <SiteFooter />
    </>
  );
}
