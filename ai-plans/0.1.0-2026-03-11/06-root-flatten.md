# 06 Root Flatten

## 目标

- 将原先的 `apps/desktop` 提升为仓库根目录唯一项目。
- 移除 `packages` 和 workspace 外壳，避免继续保留多层目录结构。

## 执行

1. 将 `assets`、`electron`、`src`、`index.html`、`vite.config.ts`、`tsup.config.ts`、`tsconfig*.json` 提升到仓库根目录。
2. 根 `package.json` 切换为桌面应用的正式配置，脚本直接在根目录运行。
3. `tsconfig` 的 `extends` 路径改为根相对路径。
4. 删除 `pnpm-workspace.yaml`，并将旧 `packages` 目录移出仓库。
5. 重新执行 `pnpm install`，让 lockfile 和根依赖布局对齐。

## 校验

- `pnpm install`
- `pnpm typecheck`
- `pnpm build`
