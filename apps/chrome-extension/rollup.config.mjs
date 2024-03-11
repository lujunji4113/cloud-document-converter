import { defineConfig } from "rollup";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { babel } from "@rollup/plugin-babel";
import terser from "@rollup/plugin-terser";
import { globSync } from "glob";

const isDev = process.env.BUILD === "development";

export default defineConfig([
  {
    input: "src/background.ts",
    output: {
      file: "bundles/background.js",
      format: "esm",
    },
    plugins: [
      typescript(),
      babel({ babelHelpers: "bundled" }),
      ...(isDev ? [] : [terser()]),
    ],
  },
  ...globSync("src/scripts/*.ts").map((input) => ({
    input,
    output: {
      dir: "bundles/scripts",
      format: "iife",
    },
    plugins: [
      nodeResolve(),
      typescript(),
      babel({ babelHelpers: "bundled" }),
      ...(isDev ? [] : [terser()]),
    ],
  })),
]);
