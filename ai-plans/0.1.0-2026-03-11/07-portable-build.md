# 07 Portable Build

## Goal

- Add a single-file Windows build path without replacing the existing installer build.

## Steps

1. Add a `dist:portable` script that builds the app and runs `electron-builder --win portable`.
2. Add an `electron:portable` alias to keep the Electron-related script naming consistent.

## Validation

- `pnpm dist:portable`
