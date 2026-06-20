import assert from "node:assert/strict";
import test from "node:test";

import {
  __setSheetsApiForTests,
  appendOrder,
  updateOrder,
} from "../server/stores/sheetsStore.js";

function mockSheets(rows) {
  const calls = {
    get: [],
    append: [],
    update: [],
    batchUpdate: [],
  };
  const api = {
    spreadsheets: {
      values: {
        async get(args) {
          calls.get.push(args);
          return { data: { values: rows } };
        },
        async append(args) {
          calls.append.push(args);
        },
        async update(args) {
          calls.update.push(args);
        },
        async batchUpdate(args) {
          calls.batchUpdate.push(args);
        },
      },
    },
  };
  return { api, calls };
}

test("appendOrder aligns values to the current sheet header", async () => {
  const header = ["name", "id", "calculated", "quantity", "timestamp"];
  const { api, calls } = mockSheets([header]);
  __setSheetsApiForTests(api);

  await appendOrder({
    id: "order-1",
    timestamp: "2026-06-19T12:00:00.000Z",
    name: "Ada",
    quantity: 3,
  });

  assert.equal(calls.get[0].range, "'Orders'!1:1");
  assert.deepEqual(calls.append[0].requestBody.values, [
    ["Ada", "order-1", "", 3, "2026-06-19T12:00:00.000Z"],
  ]);
});

test("updateOrder updates known cells without overwriting formula columns", async () => {
  const header = ["id", "timestamp", "name", "quantity", "calculated", "notes"];
  const row = ["order-1", "original-time", "Old name", 1, 15, "Old note"];
  const { api, calls } = mockSheets([header, row]);
  __setSheetsApiForTests(api);

  const updated = await updateOrder("order-1", {
    name: "New name",
    quantity: 2,
    notes: "New note",
  });

  assert.equal(updated, true);
  assert.equal(calls.update.length, 0);
  assert.deepEqual(calls.batchUpdate[0].requestBody, {
    valueInputOption: "RAW",
    data: [
      { range: "'Orders'!C2", values: [["New name"]] },
      { range: "'Orders'!D2", values: [[2]] },
      { range: "'Orders'!F2", values: [["New note"]] },
    ],
  });
});
