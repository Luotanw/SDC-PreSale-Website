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

  store
    .init()
    .catch((error) => {
      console.error("[startup] storage initialization failed", {
        name: error instanceof Error ? error.name : "UnknownError",
        code:
          error && typeof error === "object" && "code" in error
            ? String(error.code)
            : undefined,
      });
    })
    .finally(() => {
      app.listen(PORT, () => {
        console.log(`SDC order server listening on port ${PORT}`);
        console.log(`Order storage: ${store.description}`);
        if (!fs.existsSync(distDir)) {
          console.log(
            '(no dist/ build found — run "npm run dev" for the site)'
          );
        }
      });
    });
}
