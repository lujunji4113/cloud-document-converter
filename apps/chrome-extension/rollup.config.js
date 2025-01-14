import { defineConfig } from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import json from '@rollup/plugin-json'
import commonjs from '@rollup/plugin-commonjs'
import { babel } from '@rollup/plugin-babel'
import terser from '@rollup/plugin-terser'
import { globSync } from 'glob'

const isDev = process.env.BUILD === 'development'

const createSharedPlugins = (options = {}) => {
  const { runtime } = options

  const sharedPlugins = [
    typescript({
      tsconfig: `tsconfig.${runtime}.json`,
    }),
    babel({
      babelHelpers: 'bundled',
      // TODO: Exclude node_modules once https://github.com/babel/babel/issues/9419 is resolved
      exclude: [/node_modules\/core-js/],
    }),
    commonjs(),
    json(),
    ...(isDev ? [] : [terser()]),
  ]

  return sharedPlugins
}

export default defineConfig([
  {
    input: ['src/background.ts', 'src/content.ts'],
    output: {
      entryFileNames: '[name].js',
      dir: 'bundles',
      format: 'esm',
    },
    plugins: [...createSharedPlugins({ runtime: 'extension' })],
  },
  ...globSync('src/scripts/*.ts').map(input => ({
    input,
    output: {
      dir: 'bundles/scripts',
      format: 'iife',
    },
    plugins: [nodeResolve(), ...createSharedPlugins({ runtime: 'web' })],
  })),
])
