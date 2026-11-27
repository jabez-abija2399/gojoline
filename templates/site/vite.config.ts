import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { onlyUsedStyles } from "./scripts/only-used-styles";

export default defineConfig({
  plugins: [onlyUsedStyles(), react(), tailwindcss()],
  server: { port: 5173, strictPort: true, allowedHosts: true },
  build: { target: "es2020", cssMinify: true },
});
