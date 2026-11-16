import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Template sources drop fields by naming them: ({ description, ...card }) => card.
  { files: ["scripts/presets/**"], rules: { "@typescript-eslint/no-unused-vars": ["warn", { ignoreRestSiblings: true }] } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Not app code: brand build scripts, the generated-site template (own lint), reports.
    "brand/**",
    "templates/**",
    "playwright-report/**",
    "test-results/**",
    "coverage/**",
    ".lighthouseci/**",
  ]),
]);

export default eslintConfig;
