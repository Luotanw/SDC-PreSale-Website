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
