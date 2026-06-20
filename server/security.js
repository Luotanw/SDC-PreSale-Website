import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

let developmentEditSecret;

export function resolveEditSecret(env = process.env) {
  const configured = env.ORDER_EDIT_SECRET?.trim();
  if (configured) {
    if (configured.length < 32) {
      throw new Error("ORDER_EDIT_SECRET must contain at least 32 characters");
    }
    return configured;
  }
  if (env.NODE_ENV === "production") {
    throw new Error("ORDER_EDIT_SECRET is required in production");
  }
  developmentEditSecret ||= randomBytes(32).toString("base64url");
  return developmentEditSecret;
}

// Validate the Turnstile (bot-protection) configuration at startup. CAPTCHA is
// optional, but the two halves must agree:
//   • both keys set    → enforced (good).
//   • neither set      → disabled. Allowed, but warn loudly in production so the
//                        gap is visible rather than a silent fail-open.
//   • exactly one set  → broken half-config: the frontend and server disagree
//                        on whether a token is required, which either fakes
//                        protection or rejects every order. Fail the boot.
export function checkCaptchaConfig(env = process.env, logger = console) {
  const hasSecret = Boolean(env.TURNSTILE_SECRET_KEY?.trim());
  const hasSiteKey = Boolean(env.VITE_TURNSTILE_SITE_KEY?.trim());

  if (hasSecret && hasSiteKey) return;

  if (hasSecret !== hasSiteKey) {
    const present = hasSecret ? "TURNSTILE_SECRET_KEY" : "VITE_TURNSTILE_SITE_KEY";
    const missing = hasSecret ? "VITE_TURNSTILE_SITE_KEY" : "TURNSTILE_SECRET_KEY";
    throw new Error(
      `Turnstile is half-configured: ${present} is set but ${missing} is missing. ` +
        "Set both to enable bot protection, or neither to disable it."
    );
  }

  if (env.NODE_ENV === "production") {
    logger.warn?.(
      "[startup] WARNING: bot protection is DISABLED — orders are accepted " +
        "without human verification. Set TURNSTILE_SECRET_KEY and " +
        "VITE_TURNSTILE_SITE_KEY to enable Turnstile."
    );
  }
}

export function createEditToken(orderId, secret) {
  return createHmac("sha256", secret).update(orderId).digest("base64url");
}

export function verifyEditToken(orderId, suppliedToken, secret) {
  if (typeof suppliedToken !== "string" || !suppliedToken) return false;
  const expected = Buffer.from(createEditToken(orderId, secret));
  const supplied = Buffer.from(suppliedToken);
  return (
    supplied.length === expected.length &&
    timingSafeEqual(supplied, expected)
  );
}

export function bearerToken(authorization) {
  if (typeof authorization !== "string") return null;
  const match = authorization.match(/^Bearer ([A-Za-z0-9_-]+)$/);
  return match?.[1] || null;
}

export async function verifyTurnstile({
  token,
  remoteIp,
  secret = process.env.TURNSTILE_SECRET_KEY,
}) {
  if (!secret) return { success: true, skipped: true };
  if (typeof token !== "string" || !token) {
    return { success: false };
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });
  if (remoteIp) body.set("remoteip", remoteIp);

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(5_000),
    }
  );
  if (!response.ok) {
    throw new Error(`Turnstile verification returned ${response.status}`);
  }
  const result = await response.json();
  return { success: result.success === true };
}
