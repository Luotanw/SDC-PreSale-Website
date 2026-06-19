// Local order server for the SDC Donut Presale site.
// Receives orders from the website and appends each one to a CSV on disk.
//
//   node server/index.js
//
// Config (optional env vars):
//   PORT         port to listen on            (default 3001)
//   ORDERS_CSV   path to the CSV file          (default ./orders.csv)
//
// If a production build exists in ./dist, it's also served from this same
// server, so `npm start` gives you one process: the website + order storage.

import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const PORT = process.env.PORT || 3001;
const CSV_PATH = process.env.ORDERS_CSV
  ? path.resolve(process.env.ORDERS_CSV)
  : path.join(ROOT, "orders.csv");

// Columns written to the CSV, in order. "id" identifies an order so edits
// update the same row instead of appending a new one.
const FIELDS = [
  "id",
  "timestamp",
  "name",
  "email",
  "phone",
  "quantity",
  "price",
  "total",
  "pickup",
  "notes",
];

// Quote a value if it contains a comma, quote, or newline (RFC 4180).
function csvEscape(value) {
  const s = value == null ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Make sure the CSV exists with its header row before we serve traffic. On a
// fresh deploy the persistent disk starts empty, so this creates the file (and
// its parent directory) up front rather than waiting for the first order.
function ensureCsvInitialized() {
  if (fs.existsSync(CSV_PATH)) return;
  fs.mkdirSync(path.dirname(CSV_PATH), { recursive: true });
  fs.writeFileSync(CSV_PATH, FIELDS.join(",") + "\n", "utf8");
}

function appendOrder(order) {
  const fileExists = fs.existsSync(CSV_PATH);
  const rows = [];
  if (!fileExists) rows.push(FIELDS.join(",")); // header row, once
  rows.push(FIELDS.map((field) => csvEscape(order[field])).join(","));
  fs.appendFileSync(CSV_PATH, rows.join("\n") + "\n", "utf8");
}

// Minimal RFC-4180 CSV parser → array of row arrays. Handles quoted fields
// with embedded commas, quotes ("") and newlines, so it stays correct even
// when an order's notes contain those characters.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// Total dozens ("boxes") pre-ordered = sum of the quantity column.
function computeBoxesOrdered() {
  if (!fs.existsSync(CSV_PATH)) return 0;
  const rows = parseCsv(fs.readFileSync(CSV_PATH, "utf8")).filter(
    (r) => r.length && r.some((cell) => cell !== "")
  );
  if (rows.length <= 1) return 0; // header only (or empty)
  const qIndex = rows[0].indexOf("quantity");
  if (qIndex === -1) return 0;
  let total = 0;
  for (let i = 1; i < rows.length; i++) {
    const n = parseInt(rows[i][qIndex], 10);
    if (!Number.isNaN(n)) total += n;
  }
  return total;
}

function rewriteCsv(rows) {
  const out = rows.map((r) => r.map(csvEscape).join(",")).join("\n") + "\n";
  fs.writeFileSync(CSV_PATH, out, "utf8");
}

// Replace the row whose id matches, keeping its original id + timestamp.
// Returns true if a matching order was found and updated.
function updateOrder(id, changes) {
  if (!fs.existsSync(CSV_PATH)) return false;
  const rows = parseCsv(fs.readFileSync(CSV_PATH, "utf8")).filter(
    (r) => r.length && r.some((cell) => cell !== "")
  );
  if (rows.length <= 1) return false;
  const header = rows[0];
  const idIndex = header.indexOf("id");
  if (idIndex === -1) return false;

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idIndex] !== id) continue;
    const existing = {};
    header.forEach((col, j) => (existing[col] = rows[i][j]));
    // Overlay the new values; id and original timestamp are preserved.
    const merged = { ...existing, ...changes, id, timestamp: existing.timestamp };
    rows[i] = header.map((col) => (merged[col] == null ? "" : merged[col]));
    rewriteCsv(rows);
    return true;
  }
  return false;
}

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
app.post("/api/order", (req, res) => {
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
    appendOrder(order);
    console.log(`[order +] ${order.id}  ${order.name} <${order.email}>  ${order.quantity} dozen ($${order.total})`);
    res.json({ ok: true, id: order.id });
  } catch (err) {
    console.error("[order] failed to write CSV:", err);
    res.status(500).json({ ok: false, error: "Could not store the order." });
  }
});

// Update an existing order in place (used by "Edit my order").
app.put("/api/order/:id", (req, res) => {
  const body = req.body || {};
  if (!body.name || !body.email) {
    return res.status(400).json({ ok: false, error: "Name and email are required." });
  }

  try {
    const updated = updateOrder(req.params.id, orderFromBody(body));
    if (!updated) {
      return res.status(404).json({ ok: false, error: "Order not found." });
    }
    console.log(`[order ~] ${req.params.id}  ${body.name} <${body.email}>  ${body.quantity} dozen ($${body.total})`);
    res.json({ ok: true, id: req.params.id });
  } catch (err) {
    console.error("[order] failed to update CSV:", err);
    res.status(500).json({ ok: false, error: "Could not update the order." });
  }
});

app.get("/api/stats", (_req, res) => {
  try {
    res.json({ boxesOrdered: computeBoxesOrdered() });
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

ensureCsvInitialized();

app.listen(PORT, () => {
  console.log(`SDC order server listening on http://localhost:${PORT}`);
  console.log(`Orders are saved to: ${CSV_PATH}`);
  if (!fs.existsSync(distDir)) {
    console.log('(no dist/ build found — run "npm run dev" for the site, or "npm start" to build + serve here)');
  }
});
