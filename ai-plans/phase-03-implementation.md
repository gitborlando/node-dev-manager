# 阶段三：实现方案

更新时间：2026-03-10

## 改造边界

- 保留：
  - 根目录现有 `node_dev_manager_cdn.html`
  - 根目录现有 `node_dev_manager_bridge.ts`
  - 根目录现有演示组件文件
- 重构方向：
  - 新增 `apps/desktop` 作为正式应用入口。
  - 新增 `packages/shared` 和 `packages/process-core`。
  - 将旧前端原型的布局和交互迁移为真实 React 应用。
  - 将旧桥接服务的能力迁移为 Tauri 宿主命令与事件。

## 实施顺序

1. 建立 pnpm workspace 和 tsconfig 基础设施。
2. 定义共享类型与前端控制器。
3. 搭建 React 应用骨架并迁移旧界面风格。
4. 编写 Tauri 宿主进程管理逻辑。
5. 补齐运行说明、验证方法和剩余限制。
