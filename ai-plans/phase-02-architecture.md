# 阶段二：架构设计

更新时间：2026-03-10

## 目录结构

```text
apps/
  desktop/             # Tauri 桌面应用，内含 React 前端和 src-tauri 壳层
packages/
  shared/              # 共享类型、事件名、表单模型
  process-core/        # TypeScript 进程控制编排层、桥接适配器、项目存储
plans/                 # 阶段执行日志
```

## 职责划分

- `apps/desktop`
  - 承载 UI、页面布局和 Tauri 配置。
  - 只消费 `process-core` 暴露的状态与动作。
- `packages/shared`
  - 定义项目配置、运行态快照、日志事件、事件名。
- `packages/process-core`
  - 维护前端状态树。
  - 封装本地存储。
  - 屏蔽 Tauri / 浏览器演示两套运行环境差异。

## 最终通信方案

- 前端到桌面宿主：使用 `Tauri invoke` 发送命令调用。
- 桌面宿主到前端：使用 `Tauri event` 推送日志和状态变更。
- 浏览器开发模式：自动退化到内存版 mock bridge，保持 UI 可独立开发。

## 为什么优于旧桥接方案

- 不再经过本地 HTTP 端口，减少额外服务和 CORS 问题。
- 桌面宿主天然持有进程权限，职责边界更清晰。
- `invoke` 适合指令式操作，`event` 适合日志流与状态推送，语义比 `REST + SSE` 更直接。
- 通过 `shared` + `process-core` 把配置态、运行态、UI 态拆开，降低耦合。

## 运行流转

- 启动：UI 发送 `start_process`，宿主创建子进程，回传初始快照并持续发日志事件。
- 停止：UI 发送 `stop_process`，宿主标记 `stopping` 并终止进程树，退出后再广播最终状态。
- 重启：宿主先停后起，保证一次只处理同一项目的一条重启动作。
- 多进程：宿主使用以项目 `id` 为 key 的 map 跟踪进程元数据，彼此独立。
- 去耦：UI 只读控制器状态，不直接接触 Tauri API 或进程细节。
