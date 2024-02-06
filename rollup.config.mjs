import { defineConfig } from "rollup";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

const isProd = process.env.BUILD === "production";

export default defineConfig([
  {
    input: "src/service-worker.ts",
    output: {
      file: "dist/service-worker.js",
      format: "esm",
    },
    plugins: [typescript()],
  },
  {
    input: "src/lark/lark.ts",
    output: {
      file: "dist/scripts/lark.js",
      format: "iife",
    },
    plugins: [
      nodeResolve(),
      typescript(),
      isProd && (await import("@rollup/plugin-terser")).default(),
    ],
  },
]);
