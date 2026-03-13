# 03 After Pack Exe Icon Fix

## Goal

- Fix the installed app exe icon without relying on electron-builder's built-in Windows resource editing flow that fails on this machine.

## Steps

1. Confirm the packaged app exe still keeps the default Electron icon because enabling exe resource editing triggers a local `winCodeSign` extraction failure.
2. Add an `afterPack` hook compiled from TypeScript that calls `rcedit` on the packaged Windows exe.
3. Reuse electron-builder's resolved icon path and apply it to the packaged exe after pack, while keeping `signAndEditExecutable: false` to avoid the environment-specific toolchain failure.
4. Rebuild the installer and verify the packaged app exe icon is no longer the default Electron icon.

## Validation

- `pnpm typecheck`
- `pnpm build`
- `pnpm dist`
