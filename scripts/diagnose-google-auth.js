// One-off diagnostic for "invalid_grant: Invalid JWT Signature".
//
// Usage:
//   node scripts/diagnose-google-auth.js <path-to-key.json> [sheetId]
//
// Pass the downloaded service-account JSON *file* (not its contents) so there's
// no shell quoting to get wrong. The sheetId is optional — step 1 already
// proves whether the key authenticates. Falls back to the GOOGLE_CREDENTIALS /
// GOOGLE_SHEET_ID env vars if no arguments are given.

import { google } from "googleapis";
import { readFileSync } from "node:fs";

function fail(msg) {
  console.error("\n✗ " + msg);
  process.exit(1);
}

const keyPath = process.argv[2];
const sheetId = process.argv[3] || process.env.GOOGLE_SHEET_ID;

let raw;
if (keyPath) {
  try {
    raw = readFileSync(keyPath, "utf8");
  } catch (e) {
    fail("Could not read key file: " + e.message);
  }
} else {
  raw = process.env.GOOGLE_CREDENTIALS;
  if (!raw) {
    fail("Pass the key file: node scripts/diagnose-google-auth.js <path-to-key.json> [sheetId]");
  }
}

let creds;
try {
  creds = JSON.parse(raw);
} catch (e) {
  fail("Key file is not valid JSON: " + e.message);
}

const key = creds.private_key || "";
console.log("client_email   :", creds.client_email);
console.log("project_id     :", creds.project_id);
console.log("private_key_id :", creds.private_key_id);
console.log("key shape OK   :", key.includes("BEGIN PRIVATE KEY") && key.includes("\n"));

// Step 1 — the token exchange. This is the exact call that was returning
// "Invalid JWT Signature"; it needs no sheet, so it isolates the key itself.
console.log("\n[1/2] Exchanging a token (the step that was failing)…");
let client;
try {
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  client = await auth.getClient();
  await client.getAccessToken();
  console.log("✓ Auth OK — this key is valid and matches", creds.client_email);
} catch (e) {
  const g = e.response?.data;
  fail(
    "Token exchange failed: " +
      (g ? `${g.error}: ${g.error_description}` : e.message) +
      "\n  → If this is still 'Invalid JWT Signature', this key file is from the " +
      "wrong project/account. Confirm the project is sdc-pre-sale and re-download."
  );
}

// Step 2 — read the sheet. Checks the id is right AND that the sheet is shared
// with the service account. Skipped if no id was given.
if (!sheetId) {
  console.log(
    "\n(No sheet id given — auth is confirmed. To also check sheet access, pass the" +
      " sheet's URL token as the 2nd argument.)"
  );
  process.exit(0);
}
console.log("\n[2/2] Reading the sheet…");
try {
  const sheets = google.sheets({ version: "v4", auth: client });
  const res = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  console.log(
    "✓ Sheet OK:",
    res.data.properties.title,
    "— tabs:",
    (res.data.sheets || []).map((s) => s.properties.title).join(", ")
  );
} catch (e) {
  const g = e.response?.data;
  fail(
    "Sheet read failed: " +
      (g ? `${g.error?.status || g.error}: ${g.error?.message || g.error_description}` : e.message) +
      "\n  → 403: share the sheet with " + creds.client_email + " as Editor." +
      "\n  → 404: the sheet id is wrong — it's the long token in the sheet's URL," +
      " https://docs.google.com/spreadsheets/d/THIS_PART/edit (not the key id)."
  );
}
