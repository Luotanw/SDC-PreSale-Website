import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createApp } from "../server/app.js";
import {
  checkCaptchaConfig,
  createEditToken,
  verifyEditToken,
} from "../server/security.js";
import { PICKUP_WINDOWS, PRICE_PER_DOZEN } from "../shared/orderPolicy.js";

const EDIT_SECRET = "test-edit-secret-".repeat(3);

function memoryStore() {
  const orders = new Map();
  return {
    orders,
    description: "test store",
    async appendOrder(order) {
      orders.set(order.id, structuredClone(order));
    },
    async updateOrder(id, changes) {
      const existing = orders.get(id);
      if (!existing) return false;
      orders.set(id, { ...existing, ...structuredClone(changes) });
      return true;
    },
    async computeBoxesOrdered() {
      return [...orders.values()].reduce(
        (total, order) => total + order.quantity,
        0
      );
    },
  };
}

async function withServer(app, callback) {
  const server = await new Promise((resolve, reject) => {
    const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
    listening.on("error", reject);
  });
  const address = server.address();
  try {
    await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
}

function validOrder(overrides = {}) {
  return {
    name: "Ada Lovelace",
    email: "ADA@example.com",
    phone: "604-555-0100",
    quantity: 2,
    pickup: PICKUP_WINDOWS[0],
    notes: "Test order",
    ...overrides,
  };
}

function testApp(orderStore, options = {}) {
  return createApp({
    orderStore,
    editSecret: EDIT_SECRET,
    captchaVerifier: async () => ({ success: true }),
    logger: { info() {}, error() {} },
    rootDir: fs.mkdtempSync(path.join(os.tmpdir(), "presale-app-test-")),
    rateLimitsEnabled: false,
    production: true,
    ...options,
  });
}

test("server calculates price and total instead of trusting the client", async () => {
  const store = memoryStore();
  await withServer(testApp(store), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        validOrder({ price: 1, total: 1, unexpected: "ignored" })
      ),
    });
    const result = await response.json();

    assert.equal(response.status, 200);
    assert.equal(result.price, PRICE_PER_DOZEN);
    assert.equal(result.total, 2 * PRICE_PER_DOZEN);
    assert.equal(store.orders.get(result.id).price, PRICE_PER_DOZEN);
    assert.equal(store.orders.get(result.id).total, 2 * PRICE_PER_DOZEN);
    assert.equal(store.orders.get(result.id).email, "ADA@example.com");
  });
});

test("invalid quantities and pickup windows are rejected", async () => {
  const store = memoryStore();
  await withServer(testApp(store), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        validOrder({ quantity: -999, pickup: "whenever" })
      ),
    });

    assert.equal(response.status, 400);
    assert.equal(store.orders.size, 0);
  });
});

test("updates require the signed edit token", async () => {
  const store = memoryStore();
  await withServer(testApp(store), async (baseUrl) => {
    const createdResponse = await fetch(`${baseUrl}/api/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validOrder()),
    });
    const created = await createdResponse.json();

    const unauthorized = await fetch(`${baseUrl}/api/order/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validOrder({ name: "Attacker", quantity: 10 })),
    });
    assert.equal(unauthorized.status, 404);
    assert.equal(store.orders.get(created.id).name, "Ada Lovelace");

    const authorized = await fetch(`${baseUrl}/api/order/${created.id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${created.editToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        validOrder({ name: "Updated", quantity: 3, price: 0, total: 0 })
      ),
    });
    const updated = await authorized.json();
    assert.equal(authorized.status, 200);
    assert.equal(updated.total, 3 * PRICE_PER_DOZEN);
    assert.equal(store.orders.get(created.id).name, "Updated");
  });
});

test("CAPTCHA is optional but must not be half-configured", () => {
  const silent = { warn() {} };

  // A half-config (one key without the other) is broken either way → throw.
  assert.throws(
    () =>
      checkCaptchaConfig(
        { NODE_ENV: "production", VITE_TURNSTILE_SITE_KEY: "site-only" },
        silent
      ),
    /half-configured/
  );
  assert.throws(
    () =>
      checkCaptchaConfig(
        { NODE_ENV: "production", TURNSTILE_SECRET_KEY: "secret-only" },
        silent
      ),
    /half-configured/
  );

  // Both keys set → enforced, no warning.
  const enabled = [];
  checkCaptchaConfig(
    {
      NODE_ENV: "production",
      TURNSTILE_SECRET_KEY: "secret",
      VITE_TURNSTILE_SITE_KEY: "site",
    },
    { warn: (m) => enabled.push(m) }
  );
  assert.equal(enabled.length, 0);

  // Neither set in production → allowed, but warns loudly (not silent).
  const warnings = [];
  checkCaptchaConfig({ NODE_ENV: "production" }, { warn: (m) => warnings.push(m) });
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /bot protection is DISABLED/);

  // Neither set outside production → allowed and quiet.
  const devWarnings = [];
  checkCaptchaConfig({ NODE_ENV: "development" }, { warn: (m) => devWarnings.push(m) });
  assert.equal(devWarnings.length, 0);
});

test("edit tokens are bound to one order id", () => {
  const token = createEditToken(
    "4e7e8e75-10dd-4bb9-8626-ac62070df83d",
    EDIT_SECRET
  );
  assert.equal(
    verifyEditToken(
      "4e7e8e75-10dd-4bb9-8626-ac62070df83d",
      token,
      EDIT_SECRET
    ),
    true
  );
  assert.equal(
    verifyEditToken(
      "31affcec-05aa-4454-8d29-70ad004d32ad",
      token,
      EDIT_SECRET
    ),
    false
  );
});

test("malformed JSON returns a generic JSON error without a stack trace", async () => {
  const store = memoryStore();
  await withServer(testApp(store), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"name":"broken"',
    });
    const body = await response.text();

    assert.equal(response.status, 400);
    assert.match(response.headers.get("content-type"), /application\/json/);
    assert.doesNotMatch(body, /SyntaxError|node_modules|server\/app/);
  });
});

test("API responses include hardened headers and are not cached", async () => {
  const store = memoryStore();
  await withServer(testApp(store), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/stats`);

    assert.equal(response.headers.get("x-powered-by"), null);
    assert.match(
      response.headers.get("content-security-policy"),
      /default-src 'self'/
    );
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.match(response.headers.get("x-request-id"), /^[0-9a-f-]{36}$/);
    assert.equal(
      response.headers.get("permissions-policy"),
      "camera=(), microphone=(), geolocation=()"
    );
  });
});

test("configured CAPTCHA failures block order creation", async () => {
  const store = memoryStore();
  await withServer(
    testApp(store, {
      captchaVerifier: async () => ({ success: false }),
    }),
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validOrder()),
      });

      assert.equal(response.status, 400);
      assert.equal(store.orders.size, 0);
    }
  );
});

test("order endpoints enforce a per-IP rate limit", async () => {
  const store = memoryStore();
  await withServer(
    testApp(store, { rateLimitsEnabled: true }),
    async (baseUrl) => {
      let finalResponse;
      for (let request = 0; request < 11; request++) {
        finalResponse = await fetch(`${baseUrl}/api/order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validOrder()),
        });
      }

      assert.equal(finalResponse.status, 429);
      assert.equal(store.orders.size, 10);
      assert.match(finalResponse.headers.get("ratelimit-policy"), /10/);
    }
  );
});

test("successful order logs omit customer PII and edit tokens", async () => {
  const store = memoryStore();
  const messages = [];
  await withServer(
    testApp(store, {
      logger: {
        info(...values) {
          messages.push(values.join(" "));
        },
        error() {},
      },
    }),
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validOrder()),
      });
      const result = await response.json();
      const logOutput = messages.join("\n");

      assert.equal(response.status, 200);
      assert.doesNotMatch(logOutput, /Ada Lovelace|ada@example\.com/i);
      assert.doesNotMatch(logOutput, new RegExp(result.editToken));
    }
  );
});
