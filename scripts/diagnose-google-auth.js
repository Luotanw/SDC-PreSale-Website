// One-off diagnostic for "invalid_grant: Invalid JWT Signature".
//
// Usage:
//   GOOGLE_CREDENTIALS='<paste the EXACT value from Render>' \
//   GOOGLE_SHEET_ID='<your sheet id>' \
//   node scripts/diagnose-google-auth.js
//
// It prints which identity is signing, sanity-checks the private-key shape,
// then performs a real token exchange + sheet read so the failure (if any)
// reproduces here with a clear cause.

import { google } from "googleapis";

function fail(msg) {
  console.error("✗ " + msg);
  process.exit(1);
}

const raw = process.env.GOOGLE_CREDENTIALS;
if (!raw) fail("GOOGLE_CREDENTIALS is not set");

let creds;
try {
  creds = JSON.parse(raw);
} catch (e) {
  fail("GOOGLE_CREDENTIALS is not valid JSON: " + e.message);
}

const key = creds.private_key || "";
console.log("client_email   :", creds.client_email);
console.log("project_id     :", creds.project_id);
console.log("private_key_id :", creds.private_key_id);
console.log("key length     :", key.length, "chars");
console.log("has BEGIN/END  :", key.includes("BEGIN PRIVATE KEY") && key.includes("END PRIVATE KEY"));
console.log("has real \\n     :", key.includes("\n"));
console.log("has literal \\\\n :", key.includes("\\n"), "(should be false)");
console.log("trailing space :", /[ \t]\n/.test(key) || / $/.test(key.trimEnd() + " ") ? "maybe" : "no");

// Compare the above private_key_id and client_email against the active key
// listed under that service account in the Cloud Console. They must match.

console.log("\nAttempting real auth + read…");
try {
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
  });
  console.log("✓ Auth OK. Sheet title:", res.data.properties.title);
  console.log("✓ Tabs:", (res.data.sheets || []).map((s) => s.properties.title).join(", "));
} catch (e) {
  const g = e.response?.data;
  fail(
    "Auth/read failed: " +
      (g ? `${g.error}: ${g.error_description}` : e.message) +
      "\n  → If this is 'Invalid JWT Signature', the private_key does not match " +
      "the public cert for client_email above. Re-download a fresh key for THAT " +
      "service account and try again.\n  → If it's a 403/permission error instead, " +
      "auth is fine — share the sheet with the client_email as Editor."
  );
}
