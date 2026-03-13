# 07 Always Open At Login

## Goal

- Remove the incomplete startup toggle UI and make the packaged desktop app always register itself to start with Windows.

## Steps

1. Remove the desktop startup settings popover and related IPC bridge methods.
2. Register `openAtLogin: true` automatically in the Electron main process for packaged Windows builds.
3. Keep the existing single-instance behavior so a relaunch focuses the current window instead of opening another one.
4. Rebuild the installer to verify the desktop package still builds correctly.

## Validation

- `pnpm typecheck`
- `pnpm build`
- `pnpm dist`
