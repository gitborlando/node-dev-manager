# 07 Icon Refresh

## 目标

- 将产品图标切换为新添加的 `assets/icon.png`。
- 保持开发态、托盘与 Windows 打包图标一致。

## 执行

1. 在 `index.html` 中新增 `favicon`，让渲染端直接加载 `assets/icon.png`。
2. Electron 主进程的窗口图标和托盘图标统一改为 `assets/icon.png`。
3. 使用新的 `assets/icon.png` 重新生成并覆盖 `assets/icon.ico`，保留 Windows 打包入口兼容性。

## 校验

- `pnpm build`
