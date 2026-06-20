// Picks the storage backend at startup. If GOOGLE_SHEET_ID is set we store
// orders in a Google Sheet (production / free hosting); otherwise we fall back
// to the local CSV file, so `npm run dev` works with no Google setup.

import * as csvStore from "./csvStore.js";
import * as sheetsStore from "./sheetsStore.js";

export const store = process.env.GOOGLE_SHEET_ID ? sheetsStore : csvStore;
