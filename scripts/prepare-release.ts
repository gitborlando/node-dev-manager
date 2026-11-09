import { createHash } from 'node:crypto'
import { createReadStream, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as { name: string; version: string }

const checkVersion = () => {
  const tag = process.env.RELEASE_TAG
  const expected = `v${packageJson.version}`
  if (tag !== expected) {
    throw new Error(`发布标签必须与 package.json 一致：需要 ${expected}，实际为 ${tag ?? '未指定'}`)
  }
  console.log(`发布版本校验通过：${tag}`)
}

const hashFile = async (filePath: string) => {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(filePath)) hash.update(chunk)
  return hash.digest('hex')
}

const createChecksums = async () => {
  const outputDir = fileURLToPath(new URL('../dist-release/', import.meta.url))
  const prefix = `${packageJson.name}-${packageJson.version}`
  const filenames = [`${prefix}-setup-x64.exe`, `${prefix}-portable-x64.exe`].sort()
  // Reading both expected files also prevents incomplete releases from being uploaded.
  const checksums = await Promise.all(filenames.map(async filename =>
    `${await hashFile(path.join(outputDir, filename))}  ${filename}`,
  ))
  writeFileSync(path.join(outputDir, 'SHA256SUMS.txt'), `${checksums.join('\n')}\n`, 'utf8')
  console.log('已生成安装版和便携版的 SHA256SUMS.txt')
}

const command = process.argv[2]
if (command === 'check-version') {
  checkVersion()
} else if (command === 'checksums') {
  await createChecksums()
} else {
  throw new Error('用法：node scripts/prepare-release.ts <check-version|checksums>（需要 Node.js 24）')
}
