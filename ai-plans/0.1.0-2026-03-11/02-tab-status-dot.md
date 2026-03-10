# 02 Tab Status Dot

## 目标

- 去掉 tab 之间的视觉间隔。
- 在 tab 标题左侧补一个运行态绿点，用于快速识别执行中的项目。

## 执行

1. `ProjectTabs` 重新接入 `runtimeById`，读取各项目当前进程状态。
2. 将 tab 条带的 `gap` 调整为 `0`，让相邻 tab 直接贴合。
3. 在标题左侧增加状态点，运行中和启动中显示绿色，非运行态保留透明占位，避免文字抖动。

## 校验

- `pnpm typecheck`
- `pnpm build`
