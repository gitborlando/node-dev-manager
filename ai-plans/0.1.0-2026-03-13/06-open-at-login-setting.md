# 06 Open At Login Setting

## Goal

- Add a desktop setting to control whether the app starts with Windows.
- Keep login launches hidden to tray and avoid opening a duplicate window when the app is already running.

## Steps

1. Add Electron IPC endpoints to read and update login item settings.
2. Register login launches with a dedicated command-line argument so startup can stay hidden instead of showing the main window immediately.
3. Add a titlebar settings popover in the desktop UI to toggle the startup option.
4. Keep the single-instance flow focused on revealing the existing window when the app is already running.

## Validation

- `pnpm typecheck`
- `pnpm build`
- `pnpm dist`
