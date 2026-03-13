# 01 Windows Icon Entry Fix

## Goal

- Fix the Windows portable packaging failure by using `assets/icon.png` as the single icon source and removing the broken `assets/icon.ico`.

## Steps

1. Verify the build failure comes from NSIS rejecting `assets/icon.ico` as an invalid icon file.
2. Switch the Windows packaging config from `assets/icon.ico` to `assets/icon.png` so `electron-builder` handles icon conversion internally.
3. Remove `assets/icon.ico` from the repository to keep the icon source single and unambiguous.
4. Set a stable Windows `AppUserModelId` in the Electron main process so installed shortcuts and the running taskbar icon resolve to the same app identity.
5. Re-run type checking, app build, and Windows packaging to confirm the portable artifact and installer are produced.

## Validation

- `pnpm typecheck`
- `pnpm build`
- `pnpm dist:portable`
- `pnpm dist`
