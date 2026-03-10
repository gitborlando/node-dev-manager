# 2026-03-10 Electron 迁移日志

## 背景

- 目标从“轻量优先”切换为“成熟方案优先”。
- 当前桌面端基于 Tauri，开发环境已经暴露出 Rust / Cargo 工具链门槛。
- 本次迁移以最小改动为原则：保留 React UI、状态控制器、项目存储结构，只替换桌面宿主与桥接层。

## 决策

- 采用 `Electron + React + TypeScript + pnpm workspace`。
- 保留浏览器演示模式，桌面模式切换为 Electron IPC。
- 现有 `apps/desktop/src-tauri` 暂不删除，先停止接入，避免影响未提交的 Rust 文件。

## 实施范围

1. 根脚本切换到 Electron 启动链路。
2. `apps/desktop` 引入 Electron 主进程、预加载脚本和进程宿主。
3. `packages/process-core` 用 Electron IPC 替换 Tauri API。
4. `packages/shared` 补充桌面桥接常量与类型。
5. 进行 `typecheck / build` 验证，并记录结果。

## 实施日志

- 20:55 完成现状梳理，确认 UI 层可复用，宿主逻辑需要从 Rust 迁到 Node。
- 20:56 决定保留 `src-tauri` 目录但停止引用，避免覆盖现有未提交改动。
- 20:57 开始替换包脚本、桥接层和 Electron 宿主实现。
- 21:04 完成依赖切换，首次安装 `electron` 因 TLS 下载失败中断，改用国内镜像后安装成功。
- 21:07 `pnpm typecheck` 通过，`pnpm build` 首次因 `tsup` CLI 参数不兼容失败，已改为 `tsup.config.ts`。
- 21:09 `pnpm build` 通过，生成 `apps/desktop/dist` 与 `apps/desktop/dist-electron`。
- 21:12 `pnpm --filter @node-dev-mgr/desktop dist -- --dir` 通过，生成 `apps/desktop/dist-release/win-unpacked`。

## 验证结果

- `pnpm typecheck`: 通过
- `pnpm build`: 通过
- `pnpm --filter @node-dev-mgr/desktop dist -- --dir`: 通过

## 备注

- `apps/desktop/src-tauri/Cargo.toml` 当前仍有既有未提交改动，本次未触碰。
- `electron-builder` 仍提示缺少 `description` 和 `author`，但不影响 `win-unpacked` 产物生成。
