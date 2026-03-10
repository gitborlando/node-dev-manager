# 04 Tab Dot Position And Dialog Revert

## 目标

- 将 tab 状态点移到标题后面。
- 保留本轮圆角调整，同时把模态框其余视觉回退到上一版更稳妥的样式。

## 执行

1. tab 标题与状态点顺序调整为 `title -> dot`。
2. 模态框的遮罩、底色、阴影、间距和交互反馈回退到上一版。
3. 保留较小圆角，不再继续改动模态框结构和交互逻辑。

## 校验

- `pnpm typecheck`
- `pnpm build`
