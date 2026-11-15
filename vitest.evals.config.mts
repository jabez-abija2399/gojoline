import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Separate config so `npm test` never runs the (paid) eval set.
export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["evals/**/*.eval.ts"],
    testTimeout: 3_600_000,
    alias: { "server-only": new URL("./test/server-only-stub.ts", import.meta.url).pathname },
  },
});
