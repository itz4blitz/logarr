import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Custom rule overrides for the codebase
  {
    rules: {
      // Downgrade React hooks rules to warnings - many pre-existing patterns
      // that are intentional (like setState in effects for synchronization)
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/rules-of-hooks": "error", // Keep this one as error - it's critical
      // Unescaped entities are common in text content
      "react/no-unescaped-entities": "warn",
      // Allow any in test files (covered by root eslint config warnings)
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // Custom rules for integration icons that load from dynamic external URLs
  {
    files: ["src/components/integration-icon.tsx"],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
