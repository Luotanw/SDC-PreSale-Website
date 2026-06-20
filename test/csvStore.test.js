import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";

import { spreadsheetSafeValue } from "../server/stores/csvStore.js";

const execFileAsync = promisify(execFile);

test("CSV values that could execute as spreadsheet formulas are neutralized", () => {
  assert.equal(spreadsheetSafeValue("=HYPERLINK(\"https://example.com\")"), "'=HYPERLINK(\"https://example.com\")");
  assert.equal(spreadsheetSafeValue("+1+1"), "'+1+1");
  assert.equal(spreadsheetSafeValue("-1+1"), "'-1+1");
  assert.equal(spreadsheetSafeValue("@SUM(1,1)"), "'@SUM(1,1)");
  assert.equal(spreadsheetSafeValue("ordinary text"), "ordinary text");
});

test("CSV files are created with owner-only permissions", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "presale-csv-test-"));
  const csvPath = path.join(directory, "orders.csv");
  const script = `
    const store = await import(${JSON.stringify(
      new URL("../server/stores/csvStore.js", import.meta.url).href
    )});
    await store.init();
    await store.appendOrder({
      id: "test-id",
      timestamp: "2026-06-20T00:00:00.000Z",
      name: "=FORMULA()",
      email: "test@example.com",
      phone: "",
      quantity: 1,
      price: 15,
      total: 15,
      pickup: "10:00 AM – 11:00 AM",
      notes: ""
    });
  `;

  await execFileAsync(process.execPath, ["--input-type=module", "-e", script], {
    env: { ...process.env, ORDERS_CSV: csvPath },
  });

  const mode = fs.statSync(csvPath).mode & 0o777;
  const contents = fs.readFileSync(csvPath, "utf8");
  assert.equal(mode, 0o600);
  assert.match(contents, /'=FORMULA\(\)/);
});
