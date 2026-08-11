import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";

export default [
  {
    ignores: ["dist/**", "node_modules/**", ".kilo/**", "public/**"],
  },

  js.configs.recommended,

  // App code (components, hooks, utils) — browser globals + JSX. Also
  // grants node globals since a few utils (fetchWithRetry, etc.) are
  // exercised directly under `node --test`. api/og.js is included too: a
  // Vercel Edge Function that renders JSX via @vercel/og's ImageResponse.
  {
    files: ["src/**/*.{js,jsx}", "api/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      // Deliberately just the two classic hook-correctness rules, not this
      // plugin's bundled `recommended`/`recommended-latest` configs — v7
      // folded in ~15 React-Compiler-oriented rules (purity, immutability,
      // set-state-in-render, error-boundaries, ...) that assume compiled
      // output and would be noisy on this hand-written, uncompiled app.
      // Revisit if/when this project adopts the React Compiler.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // Build/data scripts — Node-only, no JSX.
  {
    files: ["scripts/**/*.js", "*.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
  },

  eslintConfigPrettier,
];
