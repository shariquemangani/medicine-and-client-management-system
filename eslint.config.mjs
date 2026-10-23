import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  { ignores: [".next*/**", "node_modules/**", "next-env.d.ts", "tailwind.config.js", "playwright-report/**", "test-results/**"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // The root barrels re-export every component and hook; one stray import pulls charts and all
    // Radix primitives into the page's first-load JS. Import the module directly instead.
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "@/components", message: "Import the component module directly, not the barrel." },
            { name: "@/hooks", message: "Import the hook module directly, not the barrel." },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
