// Order server for the SDC Donut Presale site.
// Receives orders from the website and stores each one via the configured
// storage backend (a Google Sheet in production, or a local CSV in dev).
//
//   node server/index.js
//
// Config (optional env vars):
//   PORT                port to listen on                 (default 3001)
//   ORDERS_CSV          CSV path for the local backend    (default ./orders.csv)
//   GOOGLE_SHEET_ID     if set, store orders in this Google Sheet instead
//   GOOGLE_CREDENTIALS  service-account JSON for the sheet
//   GOOGLE_SHEET_TAB    worksheet/tab name                (default "Orders")
//
// If a production build exists in ./dist, it's also served from this same
// server, so `npm start` gives you one process: the website + order storage.

import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { store } from "./stores/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const PORT = process.env.PORT || 3001;

const app = express();
app.use(express.json());

// Read the order fields from a request body into a plain object.
function orderFromBody(body) {
  return {
    name: body.name,
    email: body.email,
    phone: body.phone,
    quantity: body.quantity,
    price: body.price,
    total: body.total,
    pickup: body.pickup,
    notes: body.notes,
  };
}

// Create a new order.
app.post("/api/order", async (req, res) => {
  const body = req.body || {};
  if (!body.name || !body.email) {
    return res.status(400).json({ ok: false, error: "Name and email are required." });
  }

  const order = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    ...orderFromBody(body),
  };

  try {
    await store.appendOrder(order);
    console.log(`[order +] ${order.id}  ${order.name} <${order.email}>  ${order.quantity} dozen ($${order.total})`);
    res.json({ ok: true, id: order.id });
  } catch (err) {
    console.error("[order] failed to store order:", err);
    res.status(500).json({ ok: false, error: "Could not store the order." });
  }
});

// Update an existing order in place (used by "Edit my order").
app.put("/api/order/:id", async (req, res) => {
  const body = req.body || {};
  if (!body.name || !body.email) {
    return res.status(400).json({ ok: false, error: "Name and email are required." });
  }

  try {
    const updated = await store.updateOrder(req.params.id, orderFromBody(body));
    if (!updated) {
      return res.status(404).json({ ok: false, error: "Order not found." });
    }
    console.log(`[order ~] ${req.params.id}  ${body.name} <${body.email}>  ${body.quantity} dozen ($${body.total})`);
    res.json({ ok: true, id: req.params.id });
  } catch (err) {
    console.error("[order] failed to update order:", err);
    res.status(500).json({ ok: false, error: "Could not update the order." });
  }
});

app.get("/api/stats", async (_req, res) => {
  try {
    res.json({ boxesOrdered: await store.computeBoxesOrdered() });
  } catch (err) {
    console.error("[stats] failed to read orders:", err);
    res.status(500).json({ error: "Could not read orders." });
  }
});

// Serve the built site (if present) so one command runs everything.
const distDir = path.join(ROOT, "dist");
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get("*", (_req, res) => res.sendFile(path.join(distDir, "index.html")));
}

// Initialize storage (create the CSV/header or the sheet tab) before serving.
store
  .init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`SDC order server listening on http://localhost:${PORT}`);
      console.log(`Orders are saved to: ${store.description}`);
      if (!fs.existsSync(distDir)) {
        console.log('(no dist/ build found — run "npm run dev" for the site, or "npm start" to build + serve here)');
      }
    });
  })
  .catch((err) => {
    console.error("[startup] storage initialization failed:", err.message);
    process.exit(1);
  });
