# 05 Tray Single Click

## 目标

- 将托盘图标交互从双击打开改成单击打开。

## 执行

1. Electron 托盘事件由 `double-click` 调整为 `click`。
2. 保留现有右键菜单和退出逻辑不变。

## 校验

- `pnpm typecheck`
- `pnpm build`
