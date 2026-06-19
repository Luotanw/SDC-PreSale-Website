// Sends a reservation to the local order server, which appends it to a CSV
// on disk (see server/index.js). In dev, Vite proxies /api to the server;
// in production the same server serves the site, so /api is same-origin.
//
// Override the endpoint with VITE_ORDER_ENDPOINT if the server runs elsewhere.

const ENDPOINT = import.meta.env.VITE_ORDER_ENDPOINT || "/api/order";
const STATS_ENDPOINT = import.meta.env.VITE_STATS_ENDPOINT || "/api/stats";

/**
 * Total dozens ("boxes") pre-ordered so far, read from the server's CSV.
 * @returns {Promise<number|null>} the count, or null if it couldn't be fetched.
 */
export async function fetchBoxesOrdered() {
  try {
    const res = await fetch(STATS_ENDPOINT);
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.boxesOrdered === "number" ? data.boxesOrdered : null;
  } catch {
    return null;
  }
}

/**
 * Create a new order, or update an existing one when `id` is provided
 * (so "Edit my order" changes the previous order instead of adding another).
 * @param {{name?:string,email?:string,phone?:string,quantity?:number,price?:number,total?:number,pickup?:string,notes?:string}} order
 * @param {string|null} [id] existing order id to update
 * @returns {Promise<{ok:boolean, id?:string, error?:string}>}
 */
export async function submitOrder(order, id = null) {
  const url = id ? `${ENDPOINT}/${encodeURIComponent(id)}` : ENDPOINT;
  const method = id ? "PUT" : "POST";
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || `Server error (${res.status}).` };
    }
    return { ok: true, id: data.id };
  } catch (err) {
    console.error("[order] submission failed", err);
    return { ok: false, error: "Couldn't reach the order server. Make sure it's running." };
  }
}
