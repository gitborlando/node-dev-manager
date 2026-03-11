import react from '@vitejs/plugin-react'
import wywInJs from '@wyw-in-js/vite'
import path from 'path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const rootDir = fileURLToPath(new URL('.', import.meta.url))
const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const srcRootPattern = escapeRegExp(path.resolve(rootDir, 'src')).replaceAll(
  '\\\\',
  '[\\\\/]',
)
const styleEntrypointPattern = new RegExp(
  `${srcRootPattern}[\\\\/](app\\.[jt]sx?|component[\\\\/].*\\.[jt]sx?|style[\\\\/].*\\.[jt]sx?)$`,
)

export default defineConfig({
  base: './',
  plugins: [
    wywInJs({
      include: [styleEntrypointPattern],
    }),
    react(),
  ],
  resolve: {
    alias: {
      src: path.resolve(rootDir, 'src'),
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  server: {
    open: true,
    port: 1420,
  },
})
