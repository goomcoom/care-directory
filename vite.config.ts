import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiPort = Number(process.env.API_PORT ?? 3002);
// PORT may be assigned by the host (e.g. the in-app preview); default to 5174
// so this prototype can run beside doctors-secretary on 5173.
const webPort = Number(process.env.PORT ?? 5174);

export default defineConfig({
  plugins: [react()],
  // Set VITE_BASE=/repo-name/ when deploying under a sub-path (GitHub Pages).
  base: process.env.VITE_BASE ?? "/",
  server: {
    port: webPort,
    proxy: {
      "/api": `http://localhost:${apiPort}`,
    },
  },
});
