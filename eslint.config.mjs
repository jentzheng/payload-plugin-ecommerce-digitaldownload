import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    "dev/.next/**",
    "dec/out/**",
    "build/**",
    "dist/**",
    "dev/next-env.d.ts",
  ]),
  {
    settings: {
      // Fix for ESLint 10+: eslint-plugin-react uses context.getFilename() (legacy API)
      // which was removed in ESLint 10 flat config. Declaring the version explicitly
      // prevents the plugin from trying to auto-detect it and failing.
      react: { version: "19" },
    },
  },
]);

export default eslintConfig;
