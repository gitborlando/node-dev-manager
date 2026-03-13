# 02 Start Menu Exe Icon Fix

## Goal

- Fix the installed app showing the default Electron icon in the Start menu by allowing `electron-builder` to write the Windows exe icon resource.

## Steps

1. Confirm the installer icon is correct but the packaged app exe still uses the default Electron icon.
2. Remove `signAndEditExecutable: false` from the Windows build config so `electron-builder` can run `rcedit` and set the exe icon.
3. Rebuild the Windows installer and verify the packaged app exe no longer carries the default Electron icon.

## Validation

- `pnpm typecheck`
- `pnpm build`
- `pnpm dist`
