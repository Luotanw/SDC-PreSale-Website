import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { validateOrderBody } from "./orderValidation.js";
import {
  bearerToken,
  createEditToken,
  resolveEditSecret,
  verifyEditToken,
  verifyTurnstile,
} from "./security.js";
import { store as defaultStore } from "./stores/index.js";

const ORDER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function limiter({ windowMs, limit, message }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ ok: false, error: message });
    },
  });
}

function safeErrorDetails(error) {
  return {
    name: error instanceof Error ? error.name : "UnknownError",
    code:
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : undefined,
  };
}

export function createApp({
  orderStore = defaultStore,
  editSecret = resolveEditSecret(),
  captchaVerifier = verifyTurnstile,
  logger = console,
  rootDir = path.resolve(import.meta.dirname, ".."),
  rateLimitsEnabled = true,
  trustProxy = process.env.TRUST_PROXY,
  production = process.env.NODE_ENV === "production",
} = {}) {
  const app = express();

  if (trustProxy) {
    const parsed = Number.parseInt(trustProxy, 10);
    app.set("trust proxy", Number.isNaN(parsed) ? trustProxy : parsed);
  }

  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          connectSrc: ["'self'", "https://challenges.cloudflare.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          frameSrc: ["https://challenges.cloudflare.com"],
          imgSrc: ["'self'", "data:"],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'", "https://challenges.cloudflare.com"],
          scriptSrcAttr: ["'none'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
          ],
          upgradeInsecureRequests: production ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: "no-referrer" },
      strictTransportSecurity: production
        ? { maxAge: 31_536_000, includeSubDomains: true }
        : false,
    })
  );
  app.use((_req, res, next) => {
    res.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
  });

  app.use("/api", (req, res, next) => {
    req.requestId = randomUUID();
    res.set("X-Request-ID", req.requestId);
    res.set("Cache-Control", "no-store");
    next();
  });

  const orderLimiter = limiter({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: "Too many order requests. Please try again later.",
  });
  const statsLimiter = limiter({
    windowMs: 60 * 1000,
    limit: 120,
    message: "Too many requests. Please try again later.",
  });
  const passThrough = (_req, _res, next) => next();

  // Apply abuse controls before parsing JSON so malformed requests count
  // against the same limits and cannot repeatedly consume parser work for free.
  app.use(
    "/api/order",
    rateLimitsEnabled ? orderLimiter : passThrough
  );
  app.use(
    "/api/stats",
    rateLimitsEnabled ? statsLimiter : passThrough
  );
  app.use(express.json({ limit: "16kb", strict: true }));

  app.post(
    "/api/order",
    async (req, res) => {
      const validated = validateOrderBody(req.body);
      if (!validated.ok) {
        return res.status(400).json({ ok: false, error: validated.error });
      }

      try {
        const captcha = await captchaVerifier({
          token: req.get("X-Turnstile-Token"),
          remoteIp: req.ip,
        });
        if (!captcha.success) {
          return res.status(400).json({
            ok: false,
            error: "Human verification failed. Please try again.",
          });
        }
      } catch (error) {
        logger.error?.("[captcha.verify] failed", safeErrorDetails(error));
        return res.status(503).json({
          ok: false,
          error: "Human verification is temporarily unavailable.",
        });
      }

      const order = {
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        ...validated.value,
      };

      try {
        await orderStore.appendOrder(order);
        logger.info?.(`[order.create] request=${req.requestId}`);
        res.json({
          ok: true,
          id: order.id,
          editToken: createEditToken(order.id, editSecret),
          quantity: order.quantity,
          price: order.price,
          total: order.total,
        });
      } catch (error) {
        logger.error?.("[order.create] failed", safeErrorDetails(error));
        res.status(500).json({ ok: false, error: "Could not store the order." });
      }
    }
  );

  app.put(
    "/api/order/:id",
    async (req, res) => {
      const { id } = req.params;
      const token = bearerToken(req.get("Authorization"));
      if (
        !ORDER_ID_PATTERN.test(id) ||
        !verifyEditToken(id, token, editSecret)
      ) {
        return res.status(404).json({ ok: false, error: "Order not found." });
      }

      const validated = validateOrderBody(req.body);
      if (!validated.ok) {
        return res.status(400).json({ ok: false, error: validated.error });
      }

      try {
        const updated = await orderStore.updateOrder(id, validated.value);
        if (!updated) {
          return res.status(404).json({ ok: false, error: "Order not found." });
        }
        logger.info?.(`[order.update] request=${req.requestId}`);
        res.json({
          ok: true,
          id,
          quantity: validated.value.quantity,
          price: validated.value.price,
          total: validated.value.total,
        });
      } catch (error) {
        logger.error?.("[order.update] failed", safeErrorDetails(error));
        res.status(500).json({ ok: false, error: "Could not update the order." });
      }
    }
  );

  app.get(
    "/api/stats",
    async (_req, res) => {
      try {
        res.json({ boxesOrdered: await orderStore.computeBoxesOrdered() });
      } catch (error) {
        logger.error?.("[stats.read] failed", safeErrorDetails(error));
        res.status(500).json({ error: "Could not read orders." });
      }
    }
  );

  app.use("/api", (_req, res) => {
    res.status(404).json({ ok: false, error: "API endpoint not found." });
  });

  const distDir = path.join(rootDir, "dist");
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get("*", (_req, res) =>
      res.sendFile(path.join(distDir, "index.html"))
    );
  }

  app.use((error, _req, res, _next) => {
    const invalidJson =
      error instanceof SyntaxError && error.type === "entity.parse.failed";
    const tooLarge = error?.type === "entity.too.large";
    if (invalidJson || tooLarge) {
      return res.status(invalidJson ? 400 : 413).json({
        ok: false,
        error: invalidJson
          ? "Request body contains invalid JSON."
          : "Request body is too large.",
      });
    }
    logger.error?.("[request] unhandled error", safeErrorDetails(error));
    res.status(500).json({ ok: false, error: "Internal server error." });
  });

  return app;
}
