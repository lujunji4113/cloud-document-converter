import { defineConfig } from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import { globSync } from 'glob'

export const defineLibConfig = () =>
  defineConfig({
    input: globSync('src/*.ts', {
      ignore: {
        ignored: path => /\.d\.ts/.test(path.name),
      },
    }),
    output: {
      dir: 'dist',
      format: 'esm',
    },
    plugins: [nodeResolve(), typescript()],
  })
