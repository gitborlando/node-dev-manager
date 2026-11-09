# 添加 GitHub 发布工作流

## 实现

- 新增 `.github/workflows/release.yml`：推送 `v*` 标签或手动指定已存在标签时，在 Windows x64 环境构建 NSIS 安装版和 portable 便携版。
- 固定 Actions 到查询确认的发布版 commit SHA；Node.js 24，pnpm 版本取自项目 packageManager，冻结 lockfile 安装。
- 新增 TypeScript 发布准备脚本：校验标签与 package.json 版本一致、检查两个预期附件均存在、生成 SHA256SUMS.txt。
- 新增 `dist:release`，只构建一次再打包两种格式，显式 `--publish never`；配置不同的安装版和便携版文件名。
- 构建与发布分成独立作业，发布作业才有 contents: write；使用内置 GITHUB_TOKEN，无需个人令牌。
- 在发布作业再次校验下载附件的 SHA-256；只创建草稿，允许失败后更新原草稿，拒绝覆盖公开 Release。
- 新增 release.md，说明提交/推送标签、草稿公开、附件、失败重试、本地打包与未签名限制。

## 验证范围

- 仅检查工作流语法、版本校验逻辑及附件命名一致性；不执行应用构建、打包、提交、推送或线上发布。
