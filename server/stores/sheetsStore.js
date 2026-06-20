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

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const TAB = process.env.GOOGLE_SHEET_TAB || "Orders";

export const description = `Google Sheet ${SHEET_ID} (tab "${TAB}")`;

let sheetsApi;

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
    range: TAB,
  });
  return res.data.values || [];
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
      range: `${TAB}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [FIELDS] },
    });
  }
}

export async function appendOrder(order) {
  const sheets = await getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: TAB,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [FIELDS.map((f) => (order[f] == null ? "" : String(order[f])))] },
  });
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
    const existing = {};
    header.forEach((col, j) => (existing[col] = rows[i][j]));
    const merged = { ...existing, ...changes, id, timestamp: existing.timestamp };
    const newRow = header.map((col) => (merged[col] == null ? "" : String(merged[col])));
    // Sheet rows are 1-based and row 1 is the header, so data row i sits at i+1.
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${TAB}!A${i + 1}`,
      valueInputOption: "RAW",
      requestBody: { values: [newRow] },
    });
    return true;
  }
  return false;
}

// Total dozens ("boxes") pre-ordered = sum of the quantity column.
export async function computeBoxesOrdered() {
  const rows = await readRows();
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
