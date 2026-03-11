# 08 Electron File Base Fix

## Goal

- Fix the packaged Electron app showing a blank window because built renderer assets were referenced with root-absolute paths.

## Steps

1. Set Vite `base` to `./` so production HTML references bundled assets relatively.
2. Rebuild the renderer and installer to verify the generated `index.html` no longer points to `/assets/...`.

## Validation

- `pnpm build:renderer`
- `pnpm dist`
