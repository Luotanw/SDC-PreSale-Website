// Production entrypoint for the SDC Donut Presale site.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createApp } from "./app.js";
import { resolveEditSecret } from "./security.js";
import { store } from "./stores/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = process.env.PORT || 3001;

let editSecret;
try {
  editSecret = resolveEditSecret();
} catch (error) {
  console.error(`[startup] ${error.message}`);
  process.exitCode = 1;
}

if (editSecret) {
  const app = createApp({ editSecret, rootDir: ROOT });
  const distDir = path.join(ROOT, "dist");

  const startServer = () => {
    app.listen(PORT, () => {
      console.log(`SDC order server listening on port ${PORT}`);
      console.log(`Order storage: ${store.description}`);
      if (!fs.existsSync(distDir)) {
        console.log('(no dist/ build found — run "npm run dev" for the site)');
      }
    });
  };

  store
    .init()
    .then(startServer)
    .catch((error) => {
      // A misconfiguration — rejected/invalid credentials, a revoked key, the
      // sheet unshared or missing — will never self-heal. Fail the deploy
      // loudly with the cause so it surfaces in the logs, instead of booting
      // into a state where every order silently 500s.
      if (error && error.fatal) {
        console.error(`[startup] storage initialization failed — ${error.message}`);
        process.exit(1);
      }
      // Transient (network/rate-limit) or non-Sheets errors: log and start
      // anyway; the store retries on real requests.
      console.error(
        `[startup] storage init hit a non-fatal error, starting anyway — ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      startServer();
    });
}
