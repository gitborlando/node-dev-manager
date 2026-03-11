# 08 Tab Icon And Delete Confirm

## 目标

- 将产品图标同步到标题栏品牌位和项目 tab。
- 删除项目时增加显式确认，避免误删。

## 执行

1. 新增 `product-icon` 组件，统一引用 `assets/icon.png`。
2. 标题栏左侧品牌图标和 `project-tabs` 内的项目标签改为显示产品图标。
3. 新增 `confirm-dialog` 组件，在项目抽屉中点击删除时先弹出确认层，再执行删除。
4. 删除回调改为可等待，确认中禁用按钮，避免重复触发。

## 校验

- `pnpm build`
