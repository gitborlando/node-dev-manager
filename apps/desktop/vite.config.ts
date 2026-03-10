import react from '@vitejs/plugin-react'
import wywInJs from '@wyw-in-js/vite'
import path from 'path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const rootDir = fileURLToPath(new URL('.', import.meta.url))
const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const srcPattern = new RegExp(
  `${escapeRegExp(path.resolve(rootDir, 'src')).replaceAll('\\\\', '[\\\\/]')}[\\\\/].*\\.[jt]sx?$`,
)

export default defineConfig({
  plugins: [
    wywInJs({
      include: [srcPattern],
    }),
    react(),
  ],
  resolve: {
    alias: {
      src: path.resolve(rootDir, 'src'),
      types: path.resolve(rootDir, '../../packages/shared/src'),
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
