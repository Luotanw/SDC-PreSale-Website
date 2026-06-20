# SDC Donut Presale

A single-page charity donut presale site for the **Social Diversity for Children Foundation (SDC)**. Supporters reserve dozens of Krispy Kreme Original Glazed donuts to fund SDC's youth-led programs for children with special needs.

Built with **Vite + React** and an Express order API. Orders are stored in a
local CSV during development or in Google Sheets in production.

## Quick start

**Development** (hot-reload site + order server together):

```bash
npm install
npm run dev      # site on http://localhost:5173, order server on :3001
```

**Production / "real" use** (build the site and serve everything from one process):

```bash
npm start        # builds the site, then serves it + the order API on http://localhost:3001
```

Open the URL it prints, place an order, and it is appended to `orders.csv`.
The API calculates pricing itself, validates every field, and returns a signed
edit token that lets that browser update only the order it just created.

## Security controls

- Server-owned price and total calculations; browser-supplied pricing is ignored.
- Strict field types, lengths, quantity bounds, email validation, and approved
  pickup windows.
- HMAC-signed edit tokens instead of treating an order ID as authorization.
- Per-IP rate limits on order and statistics endpoints.
- Optional Cloudflare Turnstile enforcement for public deployments.
- Helmet security headers, CSP, no-store API responses, generic JSON errors,
  and no Express version header.
- Formula-injection protection for CSV exports and `RAW` Google Sheets writes.
- Customer names and email addresses are not written to application logs.
- Local order files are restricted to owner-only permissions (`0600`).

Production requires `ORDER_EDIT_SECRET` with at least 32 characters. Public
deployments should also configure both Turnstile variables. See `.env.example`.

## Order storage

Without `GOOGLE_SHEET_ID`, clicking **Reserve** POSTs the order to the local
server, which appends a row to **`orders.csv`** in the project root:

```
id,timestamp,name,email,phone,quantity,price,total,pickup,notes
```

- The button shows **“Reserving…”** while saving and only shows the success screen once the order is actually written; if the server is unreachable it shows an inline error instead.
- Values are CSV-escaped and spreadsheet formula characters are neutralized.
- Open `orders.csv` any time in Excel, Numbers, or Google Sheets.

When `GOOGLE_SHEET_ID` and `GOOGLE_CREDENTIALS` are configured, the same schema
is written to the selected Google Sheets tab instead.

**Configuration** (see `.env.example`):

| Variable | Default | Purpose |
|---|---|---|
| `ORDERS_CSV` | `./orders.csv` | Where orders are saved (set an absolute path to store elsewhere). |
| `PORT` | `3001` | Port the order server listens on. |
| `ORDER_EDIT_SECRET` | generated in development | Signs edit tokens; required in production. |
| `TRUST_PROXY` | unset | Set to `1` behind one trusted proxy such as Render. |
| `GOOGLE_SHEET_ID` | unset | Enables Google Sheets storage. |
| `GOOGLE_CREDENTIALS` | unset | Service-account JSON for the configured sheet. |
| `GOOGLE_SHEET_TAB` | `Orders` | Worksheet used for orders. |
| `TURNSTILE_SECRET_KEY` | unset | Enables server-side human verification. |
| `VITE_TURNSTILE_SITE_KEY` | unset | Displays the corresponding Turnstile widget. |
| `VITE_ORDER_ENDPOINT` | `/api/order` | Where the site sends orders (only change if the server runs elsewhere). |
| `VITE_STATS_ENDPOINT` | `/api/stats` | Where the site reads the public total. |

> Note: `orders.csv` is git-ignored — it's your local data, not source.

## Project structure

```
server/index.js          production entrypoint and storage initialization
server/app.js            hardened Express application and routes
server/security.js       edit-token and Turnstile verification
server/orderValidation.js server-side order validation and canonical totals
shared/orderPolicy.js    price, quantity limits, and pickup windows
public/assets/logo/      SDC logos (blue + reversed white)
src/
  styles/                global stylesheet + design tokens (colors, type, spacing, fonts)
  components/ui/          design-system primitives (Button, Card, Badge, Input, Select,
                          QuantityStepper, ProgressBar, DonutGraphic, FieldLabel, Icon)
  components/sections/    page sections (SiteHeader, Hero, CauseSection, ProductSection,
                          OrderForm, PickupPayment, SiteFooter)
  lib/submitOrder.js      creates and securely updates orders
  App.jsx                 page assembly + shared quantity state
  main.jsx                React entry
```

Icons use [`lucide-react`](https://lucide.dev). The donut artwork (`DonutGraphic`) is pure CSS — swap in real photos when available.

## Production checklist

1. Set the Google Sheets credentials and share only the required spreadsheet
   with the service account.
2. Set a strong `ORDER_EDIT_SECRET`; rotating it invalidates existing edit tokens.
3. Configure Turnstile for the exact production hostname and set both keys
   before building the Vite frontend.
4. Limit access to the Sheet and Render logs, and define how long customer
   contact information will be retained.
5. Run `npm test`, `npm run build`, and `npm audit` before deployment.

## Placeholders to confirm before launch

These are set in the components / `App.jsx` and should be replaced with real values:

- **Campaign numbers** (`src/App.jsx`): price per dozen ($15), starting boxes sold (18), goal (30).
- **Pickup details** (`src/components/sections/PickupPayment.jsx`): date (Sun, Jun 21 2026), time window (10am–4pm), full address.
- **Charity details**: BN number, contact email/phone, social handles (not currently shown in the footer — add if needed).
