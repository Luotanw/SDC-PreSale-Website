// CSV-file storage backend (used for local development).
//
// Orders are appended to a CSV file on disk. This is the original storage
// engine; in production the site uses the Google Sheets backend instead so
// orders survive on a free, ephemeral host (see sheetsStore.js).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FIELDS } from "../orderFields.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

const CSV_PATH = process.env.ORDERS_CSV
  ? path.resolve(process.env.ORDERS_CSV)
  : path.join(ROOT, "orders.csv");

export const description = `CSV file (${CSV_PATH})`;

// Quote a value if it contains a comma, quote, or newline (RFC 4180).
function csvEscape(value) {
  const s = value == null ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
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

function readRows() {
  if (!fs.existsSync(CSV_PATH)) return [];
  return parseCsv(fs.readFileSync(CSV_PATH, "utf8")).filter(
    (r) => r.length && r.some((cell) => cell !== "")
  );
}

function rewriteCsv(rows) {
  const out = rows.map((r) => r.map(csvEscape).join(",")).join("\n") + "\n";
  fs.writeFileSync(CSV_PATH, out, "utf8");
}

// Make sure the CSV exists with its header row before we serve traffic, so the
// file is present even before the first order is placed.
export async function init() {
  if (fs.existsSync(CSV_PATH)) return;
  fs.mkdirSync(path.dirname(CSV_PATH), { recursive: true });
  fs.writeFileSync(CSV_PATH, FIELDS.join(",") + "\n", "utf8");
}

export async function appendOrder(order) {
  const fileExists = fs.existsSync(CSV_PATH);
  const rows = [];
  if (!fileExists) rows.push(FIELDS.join(",")); // header row, once
  rows.push(FIELDS.map((field) => csvEscape(order[field])).join(","));
  fs.appendFileSync(CSV_PATH, rows.join("\n") + "\n", "utf8");
}

// Replace the row whose id matches, keeping its original id + timestamp.
// Returns true if a matching order was found and updated.
export async function updateOrder(id, changes) {
  const rows = readRows();
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

// Total dozens ("boxes") pre-ordered = sum of the quantity column.
export async function computeBoxesOrdered() {
  const rows = readRows();
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
