# 05 Single Instance And Startup Check

## Goal

- Confirm whether the app is configured to auto start with Windows.
- Prevent Start menu relaunches from creating a second app window when one instance is already running.

## Steps

1. Check the Electron main process for Windows login item settings and confirm there is no auto-start configuration.
2. Add a single-instance lock in the Electron main process.
3. When a second launch is attempted, focus and restore the existing main window instead of letting another instance continue.
4. Rebuild and package the app to verify the desktop entry still works with the single-instance flow.

## Validation

- `pnpm typecheck`
- `pnpm build`
- `pnpm dist`
