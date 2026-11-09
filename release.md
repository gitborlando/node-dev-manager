# Windows Release 发布

## 自动发布流程

推送 `v*` 标签后，GitHub Actions 在 Windows 上打包 x64 安装版和便携版，并创建 **Release 草稿**，不会自动公开发布。

1. 先提交需要发布的代码，以及新增的发布配置和脚本。
2. 确认 `package.json` 的 `version`，标签必须是 `v` 加该版本，例如当前 `0.1.0` 对应 `v0.1.0`。
3. 推送代码及标签：

   ```powershell
   git push origin main
   git tag v0.1.0
   git push origin v0.1.0
   ```

4. 在 GitHub 的 **Actions → Windows Release** 查看进度。
5. 成功后到仓库 **Releases** 检查草稿附件、编辑说明，确认后点击 **Publish release**。

以后每次发布都先更新版本并提交，再推送新的版本标签；不要复用已公开发布的版本标签。

## 发布附件

以 `0.1.0` 为例：

- `node-dev-mgr-0.1.0-setup-x64.exe`：Windows 安装版，推荐日常使用及开机自启场景。
- `node-dev-mgr-0.1.0-portable-x64.exe`：Windows 便携版。
- `SHA256SUMS.txt`：上述两个文件的 SHA-256 校验值。

两个可执行文件都成功生成且校验通过后才创建 Release 草稿。工作流不会上传解压后的整个应用目录。

## 失败重试

- 可在失败的 Actions 页面重新运行；工作流配置合入默认分支后，也可通过 **Run workflow** 填写已存在的标签来手动重试。
- 重试可以更新同一标签的草稿附件，但不会覆盖已经公开的 Release。
- 标签版本与 `package.json` 不一致时，会在安装依赖前停止；请修正版本并使用正确的新标签。
- 本流程使用 GitHub 自动提供的 `GITHUB_TOKEN`，不需要另配个人访问令牌。发布作业需要仓库允许 `contents: write`；构建作业只有读取权限。

## 本地打包（可选）

使用 Node.js 24、`package.json` 中指定的 pnpm 版本：

```powershell
pnpm install --frozen-lockfile
pnpm dist:release
node scripts/prepare-release.ts checksums
```

文件生成在 `dist-release`。`dist:release` 明确禁用 electron-builder 自动发布，仅打包；本地命令不会创建 GitHub Release。

当前未配置 Windows 代码签名证书，下载安装时可能出现 SmartScreen 未知发布者提示。此工作流也不包含应用内自动更新功能。
