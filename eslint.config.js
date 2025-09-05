// eslint.config.js

import globals from "globals";
import js from "@eslint/js";

export default [
  // 1. This loads the default "recommended" rules from ESLint.
  js.configs.recommended,

  // 2. This configures the environment for your specific files.
  {
    files: ["/.js", "/.mjs", "/*.cjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node, // Use Node.js global variables
      },
    },
  },

  // 3. This tells ESLint to ignore the node_modules folder.
  {
    ignores: ["node_modules/"],
  },
];
