import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During dev, forward /api requests to the local order server (server/index.js).
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
