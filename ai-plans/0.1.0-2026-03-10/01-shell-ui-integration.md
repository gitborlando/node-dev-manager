# 01 Shell UI Integration

## 目标

- 修复托盘退出后子进程未清理的问题。
- 让桌面窗口可以缩小并保持可用。
- 去掉应用对 `packages/*` 内部包的依赖，收敛到桌面端本地模块。
- 进一步压缩 UI 间距和控件尺寸。

## 执行

1. 将共享类型和控制器迁移到 `apps/desktop/src/shared`、`apps/desktop/src/core`。
2. 托盘退出改为先 `processHost.dispose()`，再真正触发 `app.quit()`。
3. `ProcessHost.stopProcess()` 增加退出等待，避免主进程提前结束。
4. 调整窗口尺寸为 `1280x820`，最小尺寸改为 `820x560`。
5. 托盘图标迁移到 `apps/desktop/assets/icon.ico`，打包时一并带上。
6. 压缩顶部栏、抽屉、标签栏、日志面板和通用控件样式。
7. 根脚本切换为 `pnpm --dir apps/desktop ...`，内部 workspace 包代码删除。
8. 收窄 `wyw-in-js` 处理范围，避免扫描非样式模块导致构建失败。

## 校验

- `pnpm typecheck`
- `pnpm build`
- `pnpm install --lockfile-only`
