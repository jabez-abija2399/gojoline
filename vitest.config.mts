import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules/**", "e2e/**", "templates/**", ".next/**"],
    // `server-only` throws outside a React Server environment; stub it in tests.
    alias: { "server-only": new URL("./test/server-only-stub.ts", import.meta.url).pathname },
  },
});
