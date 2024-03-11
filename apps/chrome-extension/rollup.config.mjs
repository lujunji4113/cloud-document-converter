import { defineConfig } from "rollup";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { babel } from "@rollup/plugin-babel";
import terser from "@rollup/plugin-terser";
import { globSync } from "glob";

const isDev = process.env.BUILD === "development";

const sharedPlugins = [
  babel({
    babelHelpers: "bundled",
    // TODO: Exclude node_modules once https://github.com/babel/babel/issues/9419 is resolved
    exclude: [/node_modules\/core-js/],
    extensions: [".js", ".mjs", ".ts"],
  }),
  commonjs(),
  ...(isDev ? [] : [terser()]),
];

export default defineConfig([
  {
    input: "src/background.ts",
    output: {
      file: "bundles/background.js",
      format: "esm",
    },
    plugins: [...sharedPlugins],
  },
  ...globSync("src/scripts/*.ts").map((input) => ({
    input,
    output: {
      dir: "bundles/scripts",
      format: "iife",
    },
    plugins: [nodeResolve(), ...sharedPlugins],
  })),
]);
