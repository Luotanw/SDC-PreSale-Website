// Google Sheets storage backend (used in production / on free hosting).
//
// Orders are appended as rows to a Google Sheet you own, so they persist even
// when the host has no durable disk. A bonus for a charity team: organizers can
// open the sheet and read/manage orders in a familiar spreadsheet.
//
// Required env vars:
//   GOOGLE_SHEET_ID     the spreadsheet id (the long token in its URL)
//   GOOGLE_CREDENTIALS  the full service-account JSON key, pasted as-is
// Optional:
//   GOOGLE_SHEET_TAB    worksheet/tab name to write to (default "Orders")
//
// The service account's email must be given Editor access to the sheet.

import { google } from "googleapis";
import { FIELDS } from "../orderFields.js";
import { parseStoredQuantity } from "../orderValidation.js";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const TAB = process.env.GOOGLE_SHEET_TAB || "Orders";
const ORDER_FIELDS = new Set(FIELDS);
const IMMUTABLE_FIELDS = new Set(["id", "timestamp"]);

// The tab name quoted for A1 notation. Sheet names with spaces or punctuation
// must be single-quoted (and internal quotes doubled), so build it once and use
// it in every range string.
const QTAB = `'${TAB.replace(/'/g, "''")}'`;

export const description = `Google Sheets tab "${TAB}"`;

let sheetsApi;

// Allow store-level tests to exercise the real Sheets request construction
// without authenticating against Google.
export function __setSheetsApiForTests(api) {
  sheetsApi = api;
  statsCache = null;
}

// Cache the pre-ordered total so /api/stats — which fires on every page load —
// doesn't read the whole sheet on each visit (Google caps reads per minute).
// Writes clear the cache so the count updates promptly after an order.
const STATS_TTL_MS = 30_000;
let statsCache = null; // { boxes, at } | null

// Lazily build an authenticated Sheets client from the service-account JSON.
async function getSheets() {
  if (sheetsApi) return sheetsApi;
  if (!process.env.GOOGLE_CREDENTIALS) {
    throw new Error("GOOGLE_CREDENTIALS is not set");
  }
  let credentials;
  try {
    credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  } catch {
    throw new Error("GOOGLE_CREDENTIALS is not valid JSON");
  }
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  sheetsApi = google.sheets({ version: "v4", auth });
  return sheetsApi;
}

// All rows currently in the tab (including the header row), as arrays.
async function readRows() {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: QTAB,
  });
  return res.data.values || [];
}

async function readHeader() {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${QTAB}!1:1`,
  });
  return (res.data.values || [])[0] || [];
}

// Convert a zero-based column index to its A1 letter (0 -> A, 26 -> AA).
function columnLetter(index) {
  let n = index + 1;
  let result = "";
  while (n > 0) {
    n--;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

// Ensure the target tab exists and its first row is our header. Creates the tab
// if it's missing and writes the header if the sheet is empty.
export async function init() {
  if (!SHEET_ID) throw new Error("GOOGLE_SHEET_ID is not set");
  const sheets = await getSheets();

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const exists = (meta.data.sheets || []).some((s) => s.properties.title === TAB);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: TAB } } }] },
    });
  }

  const rows = await readRows();
  if (rows.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${QTAB}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [FIELDS] },
    });
  }
}

export async function appendOrder(order) {
  const sheets = await getSheets();
  const header = await readHeader();
  if (header.length === 0) {
    throw new Error(`Google Sheet tab "${TAB}" has no header row`);
  }
  // RAW + pass values through by type: numbers (quantity/price/total) land as
  // numeric cells the team can SUM, while strings (e.g. phone) stay text so
  // leading zeros aren't lost. Map against the live header so organizer column
  // reordering cannot put order values under the wrong labels.
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: QTAB,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [header.map((field) => (order[field] == null ? "" : order[field]))],
    },
  });
  statsCache = null; // a new order changes the total
}

// Replace the row whose id matches, keeping its original id + timestamp.
// Returns true if a matching order was found and updated.
export async function updateOrder(id, changes) {
  const sheets = await getSheets();
  const rows = await readRows();
  if (rows.length <= 1) return false;
  const header = rows[0];
  const idIndex = header.indexOf("id");
  if (idIndex === -1) return false;

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idIndex] !== id) continue;
    // Update only mutable order columns supplied by the caller. Organizer-added
    // columns are left untouched, which preserves formulas instead of replacing
    // their rendered values with constants.
    const data = [];
    header.forEach((field, columnIndex) => {
      if (!ORDER_FIELDS.has(field) || IMMUTABLE_FIELDS.has(field)) return;
      if (!Object.prototype.hasOwnProperty.call(changes, field)) return;
      data.push({
        range: `${QTAB}!${columnLetter(columnIndex)}${i + 1}`,
        values: [[changes[field] == null ? "" : changes[field]]],
      });
    });
    if (data.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          valueInputOption: "RAW",
          data,
        },
      });
      statsCache = null; // an edited quantity may change the total
    }
    return true;
  }
  return false;
}

// Total dozens ("boxes") pre-ordered = sum of the quantity column. Served from
// a short-lived cache so bursts of page loads don't each read the whole sheet.
export async function computeBoxesOrdered() {
  if (statsCache && Date.now() - statsCache.at < STATS_TTL_MS) {
    return statsCache.boxes;
  }
  const rows = await readRows();
  let total = 0;
  if (rows.length > 1) {
    const qIndex = rows[0].indexOf("quantity");
    if (qIndex !== -1) {
      for (let i = 1; i < rows.length; i++) {
        const quantity = parseStoredQuantity(rows[i][qIndex]);
        if (quantity !== null) total += quantity;
      }
    }
  }
  statsCache = { boxes: total, at: Date.now() };
  return total;
}
