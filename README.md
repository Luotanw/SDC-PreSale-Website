# SDC Donut Presale

A single-page charity donut presale site for the **Social Diversity for Children Foundation (SDC)**. Supporters reserve dozens of Krispy Kreme Original Glazed donuts to fund SDC's youth-led programs for children with special needs.

Built with **Vite + React**, implemented from the SDC Donut Presale design system. Orders submitted on the site are saved to a **CSV file on your machine** by a small local server.

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

Open the URL it prints, place an order, and it's appended to `orders.csv`.

## Order storage (CSV on your machine)

Clicking **Reserve** POSTs the order to the local server (`server/index.js`), which appends a row to **`orders.csv`** in the project root. The first order writes the header row:

```
timestamp,name,email,phone,quantity,price,total,pickup,notes
```

- The button shows **“Reserving…”** while saving and only shows the success screen once the order is actually written; if the server is unreachable it shows an inline error instead.
- Values are CSV-escaped (RFC 4180), so commas/quotes/newlines in notes are safe.
- Open `orders.csv` any time in Excel, Numbers, or Google Sheets.

**Optional config** (see `.env.example` — none required):

| Variable | Default | Purpose |
|---|---|---|
| `ORDERS_CSV` | `./orders.csv` | Where orders are saved (set an absolute path to store elsewhere). |
| `PORT` | `3001` | Port the order server listens on. |
| `VITE_ORDER_ENDPOINT` | `/api/order` | Where the site sends orders (only change if the server runs elsewhere). |

> Note: `orders.csv` is git-ignored — it's your local data, not source.

## Project structure

```
server/index.js          local Express server: receives orders, appends to orders.csv
public/assets/logo/      SDC logos (blue + reversed white)
src/
  styles/                global stylesheet + design tokens (colors, type, spacing, fonts)
  components/ui/          design-system primitives (Button, Card, Badge, Input, Select,
                          QuantityStepper, ProgressBar, DonutGraphic, FieldLabel, Icon)
  components/sections/    page sections (SiteHeader, Hero, CauseSection, ProductSection,
                          OrderForm, PickupPayment, SiteFooter)
  lib/submitOrder.js      posts the order to the local server
  App.jsx                 page assembly + shared quantity state
  main.jsx                React entry
```

Icons use [`lucide-react`](https://lucide.dev). The donut artwork (`DonutGraphic`) is pure CSS — swap in real photos when available.

## Placeholders to confirm before launch

These are set in the components / `App.jsx` and should be replaced with real values:

- **Campaign numbers** (`src/App.jsx`): price per dozen ($15), starting boxes sold (18), goal (30).
- **Pickup details** (`src/components/sections/PickupPayment.jsx`): date (Sun, Jun 21 2026), time window (10am–4pm), full address.
- **Charity details**: BN number, contact email/phone, social handles (not currently shown in the footer — add if needed).
