import { defineConfig } from "rollup";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { globSync } from "glob";

export default defineConfig([
  {
    input: "src/background.ts",
    output: {
      file: "bundles/background.js",
      format: "esm",
    },
    plugins: [typescript()],
  },
  ...globSync("src/scripts/*.ts").map((input) => ({
    input,
    output: {
      dir: "bundles/scripts",
      format: "iife",
    },
    plugins: [nodeResolve(), typescript()],
  })),
]);
