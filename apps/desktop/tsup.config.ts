import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['electron/main.ts', 'electron/preload.ts'],
  clean: true,
  external: ['electron'],
  format: ['cjs'],
  outDir: 'dist-electron',
  outExtension: () => ({
    js: '.cjs',
  }),
  platform: 'node',
  sourcemap: true,
  splitting: false,
  target: 'node20',
  tsconfig: 'tsconfig.electron.json',
})
