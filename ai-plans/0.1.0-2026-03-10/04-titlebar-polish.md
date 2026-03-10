# 04 Titlebar Polish

## 目标

- 修复自定义标题栏中的拖拽误触发和双击无效问题。
- 让 tab 高度占满标题栏，并移除标题栏下边线。
- 将主界面按钮统一收敛为纯图标 + tooltip。
- 让终端区域真正铺满剩余空间。

## 执行

1. 补 `toggleMaximizeWindow`、`getWindowState` 和窗口状态事件，支持双击标题栏最大化/还原。
2. 标题栏根据最大化状态补右侧安全内边距，避免 Windows 无边框窗口右侧控件被遮挡。
3. tab 按钮显式关闭浏览器拖拽行为，并将 tab 高度提升到与标题栏一致。
4. 顶部工具区和日志区按钮改为纯图标交互，通过 `title` 提供 tooltip。
5. `xterm` 容器补全高度与视口样式，确保终端背景和滚动区吃满剩余区域。

## 校验

- `pnpm typecheck`
- `pnpm build`
