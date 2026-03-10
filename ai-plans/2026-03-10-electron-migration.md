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

## 2026-03-10 第二轮范围

- 窗口关闭改为最小化到托盘，不直接退出应用。
- 新建项目改为选择目录，并自动读取该目录 `package.json` 的 `scripts` 供用户选择。
- 项目模型去掉 `group` 和 `port`。
- 主界面改为顶部选项卡切换项目，日志区域承担主要工作区。
- 管理语义按“独立项目目录”处理，不强调 monorepo/workspace。

## 第二轮实施日志

- 21:18 调整共享类型与存储迁移逻辑，移除项目 `group/port` 字段，并兼容旧本地缓存。
- 21:24 补齐 Electron IPC：目录选择、读取 `package.json`、脚本排序与包管理器识别。
- 21:31 增加窗口关闭到托盘、托盘恢复与退出菜单。
- 21:37 将主界面改为顶部项目选项卡，删除旧左侧项目列表。
- 21:40 抽屉改为“选目录 + 选命令”，桌面模式通过系统目录选择器导入。
- 21:45 `pnpm typecheck`、`pnpm build`、`pnpm --filter @node-dev-mgr/desktop dist -- --dir` 全部通过。
