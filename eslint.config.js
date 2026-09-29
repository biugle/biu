import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/.biu/**", "**/node_modules/**", "**/coverage/**", "**/.husky/_/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["packages/**/*.ts", "packages/**/*.tsx", "examples/**/*.ts", "examples/**/*.tsx"],
    ignores: ["packages/icons/src/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [{ name: "lucide-react", message: "Import icons from @biugle/icons instead." }],
        },
      ],
    },
  },
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        URL: "readonly",
        console: "readonly",
      },
    },
  },
);
