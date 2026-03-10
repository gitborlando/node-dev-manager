# 阶段一：理解与审查

更新时间：2026-03-10

## 审查结论

- `AGENTS.md` 里的强约束：中文输出、增量改造、优先 TypeScript、小函数、命名尽量 `kebab-case`、完成后做可用校验。
- `node_dev_manager_cdn.html` 是完整的前端演示原型，核心价值在于布局和交互密度，不具备真实进程控制能力。
- `node_dev_manager_bridge.ts` 是旧后端原型，采用 `HTTP + JSON + SSE` 通信，已经具备进程启动/停止/重启和日志推送雏形。
- 旧通信方式的主要问题：
  - UI 和桥接服务是两个独立运行体，桌面应用场景下部署链路偏长。
  - 依赖本地端口和 CORS，Tauri 内部调用没有必要继续绕 HTTP。
  - 进程状态模型较薄，`stderr` 直接判定为 `error`，容易误伤正常输出。
  - 进程配置和运行态没有清晰分层。
- 现有 React 风格特征：
  - 紧凑、浅色、低装饰、双栏布局。
  - 操作按钮尺寸统一，边框细，状态色集中在 `sky / emerald / rose`。
  - 以列表 + 日志面板 + 左侧抽屉为主交互。
- 提供的 `btn.tsx`、`balance-item.tsx`、`text.tsx`、`lucide.tsx` 依赖仓库外上下文，无法直接复用实现，但可复用它们强调的紧凑组件尺寸和低噪音视觉语言。
- `vite.config.ts` 里建议保留的点：
  - `react` + `tailwindcss` 插件组合。
  - `src` / `types` 风格别名。
  - `build.commonjsOptions.transformMixedEsModules = true`。
  - `server.open = true`。
- 约束冲突说明：Tauri 必须保留最小 Rust 壳层，因此实际落地会将业务逻辑尽量放在 TypeScript，Rust 只保留桌面壳层和进程宿主职责。
