import {
  MAX_ORDER_QUANTITY,
  MIN_ORDER_QUANTITY,
  PICKUP_WINDOWS,
  PRICE_PER_DOZEN,
} from "../shared/orderPolicy.js";

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 40;
const MAX_NOTES_LENGTH = 500;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function stringField(value, { required = false, maxLength, label }) {
  if (value == null || value === "") {
    return required
      ? { error: `${label} is required.` }
      : { value: "" };
  }
  if (typeof value !== "string") {
    return { error: `${label} must be text.` };
  }
  const normalized = value.trim();
  if (required && !normalized) {
    return { error: `${label} is required.` };
  }
  if (normalized.length > maxLength) {
    return { error: `${label} is too long.` };
  }
  return { value: normalized };
}

export function validateOrderBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "The request body must be a JSON object." };
  }

  const name = stringField(body.name, {
    required: true,
    maxLength: MAX_NAME_LENGTH,
    label: "Name",
  });
  if (name.error) return { ok: false, error: name.error };

  const email = stringField(body.email, {
    required: true,
    maxLength: MAX_EMAIL_LENGTH,
    label: "Email",
  });
  if (email.error) return { ok: false, error: email.error };
  if (!EMAIL_PATTERN.test(email.value)) {
    return { ok: false, error: "Email is not valid." };
  }

  const phone = stringField(body.phone, {
    maxLength: MAX_PHONE_LENGTH,
    label: "Phone",
  });
  if (phone.error) return { ok: false, error: phone.error };

  const notes = stringField(body.notes, {
    maxLength: MAX_NOTES_LENGTH,
    label: "Notes",
  });
  if (notes.error) return { ok: false, error: notes.error };

  if (
    !Number.isInteger(body.quantity) ||
    body.quantity < MIN_ORDER_QUANTITY ||
    body.quantity > MAX_ORDER_QUANTITY
  ) {
    return {
      ok: false,
      error: `Quantity must be an integer from ${MIN_ORDER_QUANTITY} to ${MAX_ORDER_QUANTITY}.`,
    };
  }

  if (typeof body.pickup !== "string" || !PICKUP_WINDOWS.includes(body.pickup)) {
    return { ok: false, error: "Pickup time is not valid." };
  }

  const price = PRICE_PER_DOZEN;
  return {
    ok: true,
    value: {
      name: name.value,
      email: email.value,
      phone: phone.value,
      quantity: body.quantity,
      price,
      total: body.quantity * price,
      pickup: body.pickup,
      notes: notes.value,
    },
  };
}

export function parseStoredQuantity(value) {
  const quantity = typeof value === "number" ? value : Number(String(value));
  return Number.isInteger(quantity) &&
    quantity >= MIN_ORDER_QUANTITY &&
    quantity <= MAX_ORDER_QUANTITY
    ? quantity
    : null;
}
