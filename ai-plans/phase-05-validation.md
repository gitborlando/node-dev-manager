# 阶段五：说明与验证

更新时间：2026-03-10

## 已执行校验

- 执行命令：`pnpm --dir apps/desktop typecheck`
- 结果：未通过

## 阻塞原因

- 本地还没有安装 workspace 依赖，`tsc` 无法解析 `vite/client`。
- 错误信息：
  - `Cannot find type definition file for 'vite/client'`
  - `Local package.json exists, but node_modules missing`

## 建议验证顺序

1. 在仓库根目录执行 `pnpm install`
2. 执行 `pnpm --dir apps/desktop typecheck`
3. 执行 `pnpm --dir apps/desktop build`
4. 执行 `pnpm --dir apps/desktop tauri:dev`

## 额外说明

- `src-tauri` 目前是最小宿主实现，用于托管真实本地进程。
- 若后续你坚持严格的 “业务代码只写 TypeScript”，可以把 Rust 侧继续压缩成更薄的一层，仅保留命令入口和事件转发。
